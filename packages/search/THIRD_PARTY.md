# Third-party model and runtime

The optional E5 adapter uses [Xenova/e5-small-v2](https://huggingface.co/Xenova/e5-small-v2), an ONNX conversion of [intfloat/e5-small-v2](https://huggingface.co/intfloat/e5-small-v2). The base model card declares MIT. The pinned conversion revision is `02af79985278377e65c724a76275707cb0333c70`. See the asset hashes in `src/e5-files.ts`. Model binaries are downloaded and verified at build time, not committed here.

The E5 authors' [UniLM repository](https://github.com/microsoft/unilm) carries the following [MIT license](https://github.com/microsoft/unilm/blob/master/LICENSE). ONNX Runtime and Transformers.js also retain their own MIT/Apache notices through their installed packages and bundled license comments. The blog copies this notice alongside its generated model assets.

The MIT License (MIT)

Copyright (c) Microsoft Corporation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
