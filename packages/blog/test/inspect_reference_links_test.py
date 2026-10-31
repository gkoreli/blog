import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("references", Path(__file__).parents[1] / "scripts/inspect_reference_links.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
inspect_html = module.inspect_html
SOURCE = "https://publisher.example/guide"
TARGET = "https://research.example/study"


class ReferenceTests(unittest.TestCase):
    def test_qualifiers_nested_text_duplicates_and_fragment(self):
        result = inspect_html('<a href="https://research.example/study#method" rel="NoFollow noopener UGC"><b>The</b> study</a><a href="https://research.example/study">Again</a>', SOURCE, TARGET)
        self.assertTrue(result["directLinkPresent"])
        self.assertEqual(len(result["directLinks"]), 2)
        self.assertEqual(result["directLinks"][0]["text"], "The study")
        self.assertEqual(result["directLinks"][0]["qualifiers"], ["nofollow", "ugc"])

    def test_query_is_not_silently_dropped(self):
        result = inspect_html('<a href="https://research.example/study?version=old">Old</a>', SOURCE, TARGET)
        self.assertFalse(result["directLinkPresent"])

    def test_wrapper_and_spoof_are_not_direct_references(self):
        result = inspect_html('<a href="https://publisher.example/go/research.example/study">Wrapper</a><a href="https://research.example.attacker.test/study">Spoof</a>', SOURCE, TARGET)
        self.assertFalse(result["directLinkPresent"])
        self.assertEqual(len(result["unverifiedWrapperCandidates"]), 1)

    def test_scripts_templates_and_plain_mentions_are_not_links(self):
        result = inspect_html('<script>"<a href=\"https://research.example/study\">fake</a>"</script><template><a href="https://research.example/study">inert</a></template>https://research.example/study', SOURCE, TARGET)
        self.assertFalse(result["directLinkPresent"])

    def test_base_relative_resolution_and_html_entities(self):
        result = inspect_html('<base href="https://research.example/"><a href="study?a=1&amp;b=2">Result</a>', SOURCE, TARGET + '?a=1&b=2')
        self.assertTrue(result["directLinkPresent"])

    def test_credentials_and_non_web_urls_are_rejected(self):
        for target in ('https://name:secret@research.example/study', 'file:///private/data'):
            with self.assertRaises(ValueError):
                inspect_html('', SOURCE, target)


if __name__ == "__main__":
    unittest.main()
