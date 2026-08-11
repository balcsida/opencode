# Releasing the GHES distribution

From the release branch, verify signing before rewriting or publishing history:

```bash
probe=$(git commit-tree -S "$(git write-tree)" -p HEAD -m "chore: signing probe")
git verify-commit "$probe"
git fetch origin dev
git fetch origin feat/ghes-support
ghes_old_sha=$(git rev-parse origin/feat/ghes-support)
git rebase --gpg-sign origin/dev
git log --show-signature origin/dev..HEAD
git diff --check origin/dev...HEAD
cd packages/opencode
bun test --timeout 30000 test/cli/github-remote.test.ts test/cli/github-action.test.ts
cd ../..
git push --force-with-lease=refs/heads/feat/ghes-support:$ghes_old_sha origin feat/ghes-support
```

For the distribution branch instead, use `git push origin HEAD:refs/heads/ghes-dist`. After the branch push succeeds:

```bash
git tag -s -m "GHES distribution v<upstream>-ghes.<revision>" v<upstream>-ghes.<revision>
git push origin refs/tags/v<upstream>-ghes.<revision>
```

The tag starts `.github/workflows/ghes-release.yml`. To rerun it after a failed release, use:

```bash
gh workflow run ghes-release.yml -f tag=v<upstream>-ghes.<revision>
```

Confirm the release has all twelve archives and `checksums.txt` before sharing it.
