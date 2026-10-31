"""Inspect saved HTML for actual references; performs no network requests."""
import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit, urlunsplit

MAX_BYTES = 4 * 1024 * 1024


def retrieval_url(value: str) -> str:
    parsed = urlsplit(value)
    if parsed.scheme not in ("http", "https") or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError("an absolute HTTP(S) URL without credentials is required")
    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, parsed.query, ""))


class References(HTMLParser):
    def __init__(self, source_url: str):
        super().__init__(convert_charrefs=True)
        self.base = source_url
        self.base_seen = False
        self.hidden: list[str] = []
        self.links: list[dict] = []
        self.current: dict | None = None
        self.text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag in ("script", "style", "template"):
            self.hidden.append(tag)
        if self.hidden:
            return
        if tag == "base" and not self.base_seen and values.get("href"):
            self.base = urljoin(self.base, values["href"])
            self.base_seen = True
        if tag == "a" and values.get("href"):
            self.finish_link()
            self.current = {"href": values["href"], "rel": sorted(set((values.get("rel") or "").lower().split())), "text": ""}

    def handle_endtag(self, tag: str) -> None:
        if self.hidden:
            if self.hidden[-1] == tag:
                self.hidden.pop()
            return
        if tag == "a":
            self.finish_link()

    def handle_data(self, data: str) -> None:
        if self.hidden:
            return
        self.text.append(data)
        if self.current is not None:
            self.current["text"] += data

    def finish_link(self) -> None:
        if self.current is not None:
            self.current["text"] = " ".join(self.current["text"].split())
            self.links.append(self.current)
            self.current = None


def inspect_html(html: str, source_url: str, target_url: str) -> dict:
    retrieval_url(source_url)
    target = retrieval_url(target_url)
    parsed = References(source_url)
    parsed.feed(html)
    parsed.finish_link()
    direct = []
    wrappers = []
    target_parts = urlsplit(target)
    wrapper_marker = target_parts.netloc + target_parts.path
    for link in parsed.links:
        resolved = urljoin(parsed.base, link["href"])
        try:
            actual = retrieval_url(resolved)
        except ValueError:
            continue
        row = {**link, "resolvedUrl": resolved}
        if actual == target:
            row["qualifiers"] = sorted(set(link["rel"]) & {"nofollow", "sponsored", "ugc"})
            direct.append(row)
        elif wrapper_marker in unquote(actual):
            wrappers.append(row)
    return {
        "sourceUrl": source_url,
        "targetUrl": target,
        "directLinkPresent": bool(direct),
        "directLinks": direct,
        "unverifiedWrapperCandidates": wrappers,
        "limits": "Saved HTML links only. No rendering, redirect resolution, fragment existence, editorial independence, ranking credit, traffic or citation-use claim. Duplicate anchors on one page are one source observation.",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("html", type=Path)
    parser.add_argument("--source-url", required=True, help="Final response URL recorded during acquisition")
    parser.add_argument("--target-url", required=True)
    args = parser.parse_args()
    with args.html.open("rb") as source:
        data = source.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        parser.error("HTML exceeds the four-MiB input bound")
    result = inspect_html(data.decode("utf-8", errors="strict"), args.source_url, args.target_url)
    result["htmlSha256"] = hashlib.sha256(data).hexdigest()
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
