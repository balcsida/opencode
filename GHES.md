# GitHub Enterprise Server distribution

This fork publishes standalone OpenCode archives and a composite action for GitHub Enterprise Server runners. Install a pinned release from [balcsida/opencode releases](https://github.com/balcsida/opencode/releases):

```bash
mkdir -p ~/.opencode/bin
curl -LO https://github.com/balcsida/opencode/releases/download/v1.18.16-ghes.4/checksums.txt
curl -LO https://github.com/balcsida/opencode/releases/download/v1.18.16-ghes.4/opencode-linux-x64.tar.gz
grep '  opencode-linux-x64.tar.gz$' checksums.txt | sha256sum -c -
tar -xzf opencode-linux-x64.tar.gz -C ~/.opencode/bin
```

Or use the action:

```yaml
- uses: balcsida/opencode/github@v1.18.16-ghes.4
  with:
    model: openai/gpt-5
    version: v1.18.16-ghes.4
```

`v1.18.16-ghes.4` tracks upstream `v1.18.16`. `v<upstream>-ghes.<revision>` tracks the corresponding upstream OpenCode release, while `latest` resolves to this fork's latest GHES release.

> [!WARNING]
> These are unofficial compatibility builds, not releases supported by anomalyco/opencode. Review and pin the tag before using them in production.
> They are unsigned and un-notarized; after verifying checksums, macOS users may need `xattr -d com.apple.quarantine ~/.opencode/bin/opencode` and Gatekeeper approval.

The distribution remains licensed under [MIT](./LICENSE), subject to the upstream project's license. When upstream merges and releases GHES support, this distribution stops and users should switch back to official OpenCode releases; see [anomalyco/opencode#13860](https://github.com/anomalyco/opencode/pull/13860) or its replacement.
