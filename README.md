# PublicWebs

`in-files/` contains local plaintext and is ignored by Git. Encrypt it with `npm run encrypt:files`; the tracked result is written to `out-files/` and indexed in `file-map.json`. Restore it locally with `npm run decrypt:files`, which writes into the ignored `de-files/` directory.

`index.html` is a GitHub Pages interface for `out-files/boss-territorial-expansion.md.caesar`. It requests an access key, decodes the document in the browser, and renders the Markdown in a frame. After the first push, enable **Settings → Pages → Source → GitHub Actions** in the GitHub repository; the supplied workflow deploys every push to `main`.

This uses a Caesar byte shift of 23 for demonstration only. It is reversible and provides no real security. Enable the repository-only push check once per clone with `npm run setup`.
