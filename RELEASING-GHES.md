# Releasing the GHES distribution

Rebuild the PR branch from the immutable upstream tag before creating the distribution branch:

```bash
probe=$(git commit-tree -S "$(git write-tree)" -p HEAD -m "chore: signing probe")
git verify-commit "$probe"
git switch feat/ghes-support
test "$(git branch --show-current)" = feat/ghes-support
git fetch origin feat/ghes-support
git fetch upstream tag v1.18.16
ghes_old_sha=$(git rev-parse origin/feat/ghes-support)
if [ "$(git rev-parse HEAD)" != "$ghes_old_sha" ]; then
  echo "Local feat/ghes-support does not match origin/feat/ghes-support" >&2
  exit 1
fi
ghes_old_base=$(git merge-base "$ghes_old_sha" v1.18.16)
git rebase --gpg-sign --onto v1.18.16 "$ghes_old_base"
git range-diff "$ghes_old_base...$ghes_old_sha" "v1.18.16...HEAD"
git log --show-signature v1.18.16..HEAD
git diff --check v1.18.16...HEAD
cd packages/opencode
bun test --timeout 30000 test/cli/github-remote.test.ts test/cli/github-endpoints.test.ts
cd ../..
git push --force-with-lease=refs/heads/feat/ghes-support:$ghes_old_sha origin feat/ghes-support
```

Then rebuild the local distribution branch on the reviewed PR branch:

```bash
git switch ghes-dist
test "$(git branch --show-current)" = ghes-dist
git fetch origin ghes-dist
ghes_dist_old_sha=$(git rev-parse origin/ghes-dist)
if [ "$(git rev-parse HEAD)" != "$ghes_dist_old_sha" ]; then
  echo "Local ghes-dist does not match origin/ghes-dist" >&2
  exit 1
fi
git rebase --gpg-sign feat/ghes-support
git push --force-with-lease=refs/heads/ghes-dist:$ghes_dist_old_sha origin ghes-dist
```

After the branch push succeeds:

```bash
git tag -s -m "GHES distribution v1.18.16-ghes.4" v1.18.16-ghes.4
git push origin refs/tags/v1.18.16-ghes.4
```

The tag starts `.github/workflows/ghes-release.yml`. Recover a failed tag run without relying on workflow dispatch from the default branch:

```bash
gh run rerun <failed-run-id>
gh run watch <failed-run-id> --exit-status
gh run view <failed-run-id> --log-failed
```

Confirm the release has all twelve archives and `checksums.txt` before sharing it.
