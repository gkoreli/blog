# Probe captures: full request headers seen by the gkoreli.com Worker

Method: `wrangler tail --format json` on the production Worker (`gkoreli-com`) while each assistant was asked, in a fresh chat, to open a unique URL of the form `https://gkoreli.com/does-llms-txt-work?probe=<name>` and quote the H1. Attribution is by the unique query string: only the named assistant was ever given that URL. Captured 2026-09-03 03:55–04:30 UTC. Client IPs are shown only when they fall inside a vendor-published IP list; otherwise the ASN, organisation and country stand in for the address.

Cloudflare-added headers (`cf-*`, `x-real-ip`, `x-forwarded-proto`, `host`, `connection`) are omitted. Header names are as received (lower-cased by the runtime). Header order is not preserved by the tail event.

## `hdr1` — 2026-09-03 03:55:12 UTC

- Network: AS62887 WhiteSky Communications, LLC., country US, Cloudflare colo SEA
- IP in a vendor list: no
- Protocol: HTTP/2, TLSv1.3, ClientHello length 312, cipher-set hash `eDGmD1H99AwNYzOR+7eoGLo6eLU=`, extension-set hash `Ub+nUmIm1U57hdNSUph0R+kx9Gc=`

```http
accept: text/markdown, text/html;q=0.9
accept-encoding: gzip, br
user-agent: ProbeAgent/1.0 (+headers-test)
```

## `claudecode-webfetch` — 2026-09-03 03:56:50 UTC

- Network: AS62887 WhiteSky Communications, LLC., country US, Cloudflare colo SEA
- IP in a vendor list: no
- Protocol: HTTP/1.1, TLSv1.3, ClientHello length 1463, cipher-set hash `tLt94YkR/yUiWQeOc4ow07DiA9U=`, extension-set hash `IDS2jshLLK/HGrjct4bpWAlzt4s=`

```http
accept: text/markdown, text/html, */*
accept-encoding: gzip, br
user-agent: Claude-User (claude-code/2.1.259; +https://support.anthropic.com/)
```

## `chatgpt` — 2026-09-03 03:57:28 UTC

- Network: AS8075 Microsoft Limited, country US, Cloudflare colo DFW
- IP in a vendor list: chatgpt-user.json (9.129.45.186)
- Protocol: HTTP/2, TLSv1.3, ClientHello length 508, cipher-set hash `xWtDJfIZGwhhu4n0y6l7XO1WR6E=`, extension-set hash `XXH8ek08xcXyrTOoqPlimHTPPeA=`

```http
accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9
accept-encoding: gzip, br
accept-language: en-US,en;q=0.9
user-agent: Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot
x-envoy-expected-rq-timeout-ms: 15000
x-request-id: 2282895d-ebc7-4653-a7b7-d1cd1af59a97
```

## `claude` — 2026-09-03 03:58:09 UTC

- Network: AS396982 Google LLC, country US, Cloudflare colo IAD
- IP in a vendor list: bots.json (34.162.230.222)
- Protocol: HTTP/1.1, TLSv1.3, ClientHello length 1533, cipher-set hash `EPPWGkMwL/+VHBbDlFeYFF2S3W0=`, extension-set hash `L9gAwdYM96wD8xcublQ4JrojsbM=`

```http
accept: */*
accept-encoding: gzip, br
user-agent: Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +claude-user@anthropic.com)
```

## `gemini` — 2026-09-03 04:01:10 UTC

- Network: AS15169 Google LLC, country US, Cloudflare colo SEA
- IP in a vendor list: no
- Protocol: HTTP/1.1, TLSv1.3, ClientHello length 508, cipher-set hash `bzIoN6qRA6M2nUZwCJMACbyhX1o=`, extension-set hash `Jz9AFu9xkdMiuJ0go+66sSsnkzI=`

```http
accept: */*
accept-encoding: gzip, br
user-agent: Google
```

## `grok` — 2026-09-03 04:03:18 UTC

- Network: AS3257 Web2Objects LLC, country US, Cloudflare colo IAD
- IP in a vendor list: no
- Protocol: HTTP/2, TLSv1.3, ClientHello length 508, cipher-set hash `fkGCT0aGJcgmlIuI8JlWO23naXc=`, extension-set hash `x5kvOkv0ePZWWisPP4F6kJmrcas=`

```http
accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
accept-encoding: gzip, br
accept-language: en-US,en;q=0.9
priority: u=0, i
sec-fetch-dest: document
sec-fetch-mode: navigate
sec-fetch-site: none
user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Safari/605.1.15
```

## `grok` — 2026-09-03 04:03:18 UTC

- Network: AS9009 Aventice LLC, country US, Cloudflare colo EWR
- IP in a vendor list: no
- Protocol: HTTP/2, TLSv1.3, ClientHello length 508, cipher-set hash `L75k4jpt96L/qk+PIP9rclcgEWo=`, extension-set hash `2VR9GbMHtODE3OCf3nCzwZh42sY=`

```http
accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
accept-encoding: gzip, br
accept-language: en-US,en;q=0.9
priority: u=0, i
sec-fetch-dest: document
sec-fetch-mode: navigate
sec-fetch-site: none
user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Safari/605.1.15
```

## `grok` — 2026-09-03 04:03:18 UTC

- Network: AS262988 Pombonet Telecomunicações e Informática, country BR, Cloudflare colo GRU
- IP in a vendor list: no
- Protocol: HTTP/2, TLSv1.3, ClientHello length 1744, cipher-set hash `nWmr2CuvhM3+1BAitb/WHA2q9wk=`, extension-set hash `aoHP2nGxU62Jhn0w0NRWRqHREJA=`

```http
accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9
accept-encoding: gzip, br
accept-language: en-US,en;q=0.9
priority: u=0, i
sec-ch-ua: "Chromium";v="143", "Google Chrome";v="143", "Not_A Brand";v="99"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "macOS"
sec-fetch-dest: document
sec-fetch-mode: navigate
sec-fetch-site: none
user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36
```

## `grok` — 2026-09-03 04:03:18 UTC

- Network: AS132817 DZCRD Networks Ltd, country NL, Cloudflare colo AMS
- IP in a vendor list: no
- Protocol: HTTP/2, TLSv1.3, ClientHello length 1744, cipher-set hash `omXii3/A8TcEoK4v8ABTAazY/ao=`, extension-set hash `JKwAowKsufW9uUCZF8Jzhdmf+CE=`

```http
accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9
accept-encoding: gzip, br
accept-language: en-US,en;q=0.9
priority: u=0, i
sec-ch-ua: "Chromium";v="143", "Google Chrome";v="143", "Not_A Brand";v="99"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "macOS"
sec-fetch-dest: document
sec-fetch-mode: navigate
sec-fetch-site: none
user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36
```

## `grok` — 2026-09-03 04:03:18 UTC

- Network: AS13280 Three Ireland (Hutchison) - Mobile Subscriber Pools, country IE, Cloudflare colo DUB
- IP in a vendor list: no
- Protocol: HTTP/2, TLSv1.3, ClientHello length 1776, cipher-set hash `TkWWX+BVdX+teLUyccOBfetwATE=`, extension-set hash `PpQ+4jReWui/uY9EYsPN7QgvB1A=`

```http
accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9
accept-encoding: gzip, br
accept-language: en-US,en;q=0.9
priority: u=0, i
sec-ch-ua: "Chromium";v="143", "Google Chrome";v="143", "Not_A Brand";v="99"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "macOS"
sec-fetch-dest: document
sec-fetch-mode: navigate
sec-fetch-site: none
user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36
```

## `grok` — 2026-09-03 04:03:19 UTC

- Network: AS212238 Private Customer, country ZA, Cloudflare colo JNB
- IP in a vendor list: no
- Protocol: HTTP/2, TLSv1.3, ClientHello length 1744, cipher-set hash `j7bXVc3l/qer8FRj2aEiq0rx1ro=`, extension-set hash `w4Ao2Pbq5wM/woOdsdjJHiurlBE=`

```http
accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9
accept-encoding: gzip, br
accept-language: en-US,en;q=0.9
priority: u=0, i
sec-ch-ua: "Chromium";v="143", "Google Chrome";v="143", "Not_A Brand";v="99"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "macOS"
sec-fetch-dest: document
sec-fetch-mode: navigate
sec-fetch-site: none
user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36
```

## `grok` — 2026-09-03 04:03:22 UTC

- Network: AS7979 Servers.com, Inc., country US, Cloudflare colo DFW
- IP in a vendor list: no
- Protocol: HTTP/2, TLSv1.3, ClientHello length 1744, cipher-set hash `omXii3/A8TcEoK4v8ABTAazY/ao=`, extension-set hash `IfNKXQ4UGELyGebn4amB6YqYlTE=`

```http
accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9
accept-encoding: gzip, br
accept-language: en-US,en;q=0.9
priority: u=0, i
sec-ch-ua: "Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "macOS"
sec-fetch-dest: document
sec-fetch-mode: navigate
sec-fetch-site: none
user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36
```

## `grok` — 2026-09-03 04:03:30 UTC

- Network: AS398781 Private Customer, country US, Cloudflare colo IAD
- IP in a vendor list: no
- Protocol: HTTP/2, TLSv1.3, ClientHello length 1808, cipher-set hash `qUlYa/u1n4QQ0ikv+ReyY9Hq/6I=`, extension-set hash `BnsPmUKHAlb1dswzGAbT+FHdxSY=`

```http
accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9
accept-encoding: gzip, br
accept-language: en-US,en;q=0.9
priority: u=0, i
sec-ch-ua: "Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "macOS"
sec-fetch-dest: document
sec-fetch-mode: navigate
sec-fetch-site: none
user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36
```

## `chrome-navigation` — 2026-09-03 04:04:03 UTC

- Network: AS62887 WhiteSky Communications, LLC., country US, Cloudflare colo SEA
- IP in a vendor list: no
- Protocol: HTTP/3, TLSv1.3, ClientHello length 1907, cipher-set hash `3HTt3+R/6BL3zeALJDSq0pR1yOQ=`, extension-set hash `Txx+fb+M1qipEsrEeceufQFhtAI=`

```http
accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
accept-encoding: gzip, br
accept-language: en-US,en;q=0.9,ka;q=0.8,ru;q=0.7
priority: u=0, i
sec-ch-ua: "Chromium";v="152", "Not?A_Brand";v="24", "Google Chrome";v="152"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "macOS"
sec-fetch-dest: document
sec-fetch-mode: navigate
sec-fetch-site: cross-site
upgrade-insecure-requests: 1
user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36
```

## `duckai-path` — 2026-09-03 04:59:33 UTC

- Network: AS8075 Microsoft Corporation, country US, Cloudflare colo SEA
- IP in a vendor list: duckassistbot.json (20.3.1.178)
- Protocol: HTTP/2, TLSv1.3, ClientHello length 1508, cipher-set hash `QrF6UadKW3vtNOqdNqbd4frxxxE=`, extension-set hash `4bG1Y8rLaQO7Zz8LsR9/kLSZA1k=`

```http
accept: */*
accept-encoding: gzip, br
signature: sig1=:NBrgbVdKFeZEFLnpQx0osM5xAZ5wfGP1TBvYC2NBrYycNLKuX7EU+lsLxylIYn8A0f3zshL8IZRdP+fj3VkzBA==:
signature-agent: "https://assistbot.duckduckgo.com"
signature-input: sig1=("@authority" "signature-agent");created=1788411572;expires=1788412172;keyid="Ov3HDsa8JQ39dPEYFvFFN-cUpnz9yNI8LDvr-5LeiBM";alg="ed25519";tag="web-bot-auth"
user-agent: DuckAssistBot/1.2; (+http://duckduckgo.com/duckassistbot.html)
```

## `mistral-path` — 2026-09-03 05:00:58 UTC

- Network: AS8075 Microsoft Corporation, country SE, Cloudflare colo ARN
- IP in a vendor list: mistralai-user-ips.json (20.240.194.83)
- Protocol: HTTP/2, TLSv1.3, ClientHello length 522, cipher-set hash `omXii3/A8TcEoK4v8ABTAazY/ao=`, extension-set hash `UG/cN80UumUrDkHjDV8c+XgxtZo=`

```http
accept: text/html,application/xhtml+xml,application/xml,application/json;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
accept-encoding: gzip, br
accept-language: en-US,en;q=0.9
cache-control: no-cache
pragma: no-cache
sec-ch-ua: "Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "macOS"
sec-fetch-dest: document
sec-fetch-mode: navigate
sec-fetch-site: none
sec-fetch-user: ?1
upgrade-insecure-requests: 1
user-agent: Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; MistralAI-User/1.0; +https://docs.mistral.ai/robots)
```

## `mistral-path` — 2026-09-03 05:00:58 UTC

- Network: AS8075 Microsoft Limited, country SE, Cloudflare colo ARN
- IP in a vendor list: mistralai-user-ips.json (51.12.243.114)
- Protocol: HTTP/2, TLSv1.3, ClientHello length 522, cipher-set hash `j7bXVc3l/qer8FRj2aEiq0rx1ro=`, extension-set hash `hopVKSbUDmf9AUcGl4J+MuUwbsM=`

```http
accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
accept-encoding: gzip, br
content-length: 0
upgrade-insecure-requests: 1
user-agent: Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; MistralAI-User/1.0; +https://docs.mistral.ai/robots)
```

## `grok-second-run` — 2026-09-03 05:03:57 UTC

- Network: AS3257 Web2Objects LLC, country US, Cloudflare colo IAD
- IP in a vendor list: no
- Protocol: HTTP/2, TLSv1.3, ClientHello length 508, cipher-set hash `0W+MC96UvHmcGJousI0zx0wZ2Eg=`, extension-set hash `OH9EnflPclwSkC8iVuuLshTKAq0=`

```http
accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
accept-encoding: gzip, br
accept-language: en-US,en;q=0.9
priority: u=0, i
sec-fetch-dest: document
sec-fetch-mode: navigate
sec-fetch-site: none
user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Safari/605.1.15
```

## `grok-second-run` — 2026-09-03 05:03:58 UTC

- Network: AS212238 GTT - EMEA Ltd., country MX, Cloudflare colo DFW
- IP in a vendor list: no
- Protocol: HTTP/2, TLSv1.3, ClientHello length 1712, cipher-set hash `lfngDnNByKm4t39f07Exsb7L5Ys=`, extension-set hash `wPPgD1dkT0r1PKJ1bgLNZ6YMLcY=`

```http
accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9
accept-encoding: gzip, br
accept-language: en-US,en;q=0.9
priority: u=0, i
sec-ch-ua: "Chromium";v="143", "Google Chrome";v="143", "Not_A Brand";v="99"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "macOS"
sec-fetch-dest: document
sec-fetch-mode: navigate
sec-fetch-site: none
user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36
```

## `grok-second-run` — 2026-09-03 05:03:58 UTC

- Network: AS52361 ORTIZ MARIA MARGARITA, country AR, Cloudflare colo EZE
- IP in a vendor list: no
- Protocol: HTTP/2, TLSv1.3, ClientHello length 508, cipher-set hash `Q+L6FmABEyLfI1/FywkN1sQFi3Q=`, extension-set hash `jSx6Y9qJBJjO/TwEAr+yeSUGBpc=`

```http
accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
accept-encoding: gzip, br
accept-language: en-US,en;q=0.9
priority: u=0, i
sec-fetch-dest: document
sec-fetch-mode: navigate
sec-fetch-site: none
user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Safari/605.1.15
```

## `grok-second-run` — 2026-09-03 05:03:58 UTC

- Network: AS268249 DESTAK NET LTDA, country BR, Cloudflare colo GRU
- IP in a vendor list: no
- Protocol: HTTP/2, TLSv1.3, ClientHello length 1808, cipher-set hash `KuGfs2vBuh8l0G+IPFHc60e2nNk=`, extension-set hash `tZ0JKZcnJ0h2UvNXcBXrwOKHVq4=`

```http
accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9
accept-encoding: gzip, br
accept-language: en-US,en;q=0.9
priority: u=0, i
sec-ch-ua: "Chromium";v="143", "Google Chrome";v="143", "Not_A Brand";v="99"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "macOS"
sec-fetch-dest: document
sec-fetch-mode: navigate
sec-fetch-site: none
user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36
```

## `grok-second-run` — 2026-09-03 05:03:59 UTC

- Network: AS28573 Claro NXT Telecomunicacoes Ltda, country BR, Cloudflare colo GIG
- IP in a vendor list: no
- Protocol: HTTP/2, TLSv1.3, ClientHello length 508, cipher-set hash `vAFumPvJuT3f+HNRjb+3nlOjMZc=`, extension-set hash `HOcieq8uMk9BP+jJeF1HizZWI+E=`

```http
accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
accept-encoding: gzip, br
accept-language: en-US,en;q=0.9
priority: u=0, i
sec-fetch-dest: document
sec-fetch-mode: navigate
sec-fetch-site: none
user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Safari/605.1.15
```

## `grok-second-run` — 2026-09-03 05:03:59 UTC

- Network: AS55286 B2 Net Solutions Inc., country US, Cloudflare colo LAX
- IP in a vendor list: no
- Protocol: HTTP/2, TLSv1.3, ClientHello length 1776, cipher-set hash `3ITBaTW+cfXno+jbp1Rd9MJFgto=`, extension-set hash `/E4tb0aa9UrtAK27sbz+02q/AJU=`

```http
accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9
accept-encoding: gzip, br
accept-language: en-US,en;q=0.9
priority: u=0, i
sec-ch-ua: "Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "macOS"
sec-fetch-dest: document
sec-fetch-mode: navigate
sec-fetch-site: none
user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36
```

## `grok-second-run` — 2026-09-03 05:04:01 UTC

- Network: AS11798 Metronet, country US, Cloudflare colo SEA
- IP in a vendor list: no
- Protocol: HTTP/2, TLSv1.3, ClientHello length 508, cipher-set hash `Zf9en6mIWGCOV+lwZUs/MErx0f8=`, extension-set hash `cz7ImdX+ADIe6vJ3DBvnXeM9sOU=`

```http
accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
accept-encoding: gzip, br
accept-language: en-US,en;q=0.9
priority: u=0, i
sec-fetch-dest: document
sec-fetch-mode: navigate
sec-fetch-site: none
user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Safari/605.1.15
```

## `grok-second-run` — 2026-09-03 05:04:03 UTC

- Network: AS209709 Zappie Host LLC, country FR, Cloudflare colo CDG
- IP in a vendor list: no
- Protocol: HTTP/2, TLSv1.3, ClientHello length 1712, cipher-set hash `DZ1S165cLv9arvI/bxhinz+mlRo=`, extension-set hash `Z4cYUpKtufmna4DsbUg5GXe18WU=`

```http
accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9
accept-encoding: gzip, br
accept-language: en-US,en;q=0.9
priority: u=0, i
sec-ch-ua: "Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "macOS"
sec-fetch-dest: document
sec-fetch-mode: navigate
sec-fetch-site: none
user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36
```

## `grok-second-run` — 2026-09-03 05:04:19 UTC

- Network: AS62887 WhiteSky Communications, LLC., country US, Cloudflare colo SEA
- IP in a vendor list: no
- Protocol: HTTP/3, TLSv1.3, ClientHello length 1919, cipher-set hash `3HTt3+R/6BL3zeALJDSq0pR1yOQ=`, extension-set hash `jpm9J7oruLGI/DmIK4dokiQxbY4=`

```http
accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
accept-encoding: gzip, br
accept-language: en-US,en;q=0.9,ka;q=0.8,ru;q=0.7
priority: u=0, i
sec-ch-ua: "Chromium";v="152", "Not?A_Brand";v="24", "Google Chrome";v="152"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "macOS"
sec-fetch-dest: document
sec-fetch-mode: navigate
sec-fetch-site: cross-site
sec-fetch-user: ?1
upgrade-insecure-requests: 1
user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36
```

## `codex%2Dsearch` — 2026-09-03 05:15:59 UTC

- Network: AS14618 Amazon Data Services Northern Virginia, country US, Cloudflare colo IAD
- IP in a vendor list: no
- Protocol: HTTP/1.1, TLSv1.2, ClientHello length 239, cipher-set hash `92MdFu0K9xXMB7ZENxJUajKWT9k=`, extension-set hash `+C3Bh/F9UaeOK0g3ptJN577jGXA=`

```http
accept: */*
accept-encoding: gzip, br
baggage: sentry-environment=production,sentry-public_key=e6210d6b5d3246c29d5667b356d11c63,sentry-release=ha_github_commits_consumer@459382,sentry-trace_id=6ea28e3b55d3451380921b242be01608
range: bytes: 0-22
traceparent: 00-ab1a18ed3323b72e0c717ec76b7c02b6-5cb1b6d09f7eba0b-03
user-agent: Mozilla/5.0 (compatible)
```

## `chatgpt-mobile` — 2026-09-03 05:22:17 UTC

- Network: AS8075 Microsoft Limited, country US, Cloudflare colo DFW
- IP in a vendor list: chatgpt-user.json (9.129.45.183)
- Protocol: HTTP/2, TLSv1.3, ClientHello length 508, cipher-set hash `xWtDJfIZGwhhu4n0y6l7XO1WR6E=`, extension-set hash `XXH8ek08xcXyrTOoqPlimHTPPeA=`

```http
accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9
accept-encoding: gzip, br
accept-language: en-US,en;q=0.9
user-agent: Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot
x-envoy-expected-rq-timeout-ms: 15000
x-request-id: 5dcb181c-1b21-4808-82a5-898bf541a685
```

## `grok-mobile` — 2026-09-03 05:22:58 UTC

- Network: AS396982 Google LLC, country US, Cloudflare colo IAD
- IP in a vendor list: no
- Protocol: HTTP/2, TLSv1.3, ClientHello length 1712, cipher-set hash `qUlYa/u1n4QQ0ikv+ReyY9Hq/6I=`, extension-set hash `1pjUW4FDVxA8NypmktHsqsB5MO0=`

```http
accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
accept-encoding: gzip, br
accept-language: en-US,en;q=0.9
priority: u=0, i
sec-ch-ua: "Chromium";v="148", "Google Chrome";v="148", "Not/A)Brand";v="99"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "Linux"
sec-fetch-dest: document
sec-fetch-mode: navigate
sec-fetch-site: none
sec-fetch-user: ?1
upgrade-insecure-requests: 1
user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.0.0 Safari/537.36
```
