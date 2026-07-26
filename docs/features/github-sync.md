# GitHub sync

KnowlegeGraph treats GitHub as a portable Markdown backup and version history,
not as the primary database. Local saves complete immediately and do not depend
on network availability.

## Repository setup

1. Create a GitHub repository with at least one initial commit. Selecting
   **Add a README** while creating the repository is sufficient.
2. Create a fine-grained personal access token restricted to that repository.
3. Give it **Contents: Read and write** repository permission.
4. In KnowlegeGraph Settings, enter the owner, repository, branch, destination
   directory, and token.
5. Select **Verify & sync now**.

GitHub recommends fine-grained tokens over classic personal access tokens. The
Git Data endpoints used by this feature require repository Contents write
permission. See GitHub's official
[credential guidance](https://docs.github.com/en/rest/authentication/keeping-your-api-credentials-secure)
and [fine-grained permission reference](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens).

## Generated repository layout

With the default `knowledge` directory:

```text
knowledge/
├── README.md
├── graph.json
└── nodes/
    ├── cap-theorem.md
    └── redis-streams.md
```

- Node files contain YAML front matter, notes, resources, and relationships.
- `graph.json` contains compact graph metadata for tooling and visualization.
- `README.md` groups active nodes by section and links to their Markdown files.

The extension only modifies files beneath the configured directory.

## Durable queue

Every node mutation writes its local change and a `syncJobs` record in the same
IndexedDB transaction:

```text
Local mutation
  -> IndexedDB node write
  -> durable queue job
  -> immediate background notification
  -> scheduled retry when needed
```

Supported operations:

- `upsert`: write a created or updated node;
- `delete`: remove the old Markdown path;
- `refresh`: regenerate every node, used after import or initial connection.

Jobs are claimed transactionally. A second popup or worker sees claimed work as
unavailable. Claims older than five minutes are treated as abandoned and
returned to pending, which handles normal Manifest V3 service-worker
termination.

Failures increment the attempt count, retain a short error message, and return
the job to pending. Local knowledge is never rolled back because a remote sync
failed.

## Atomic GitHub commit

A sync batch uses GitHub's Git Data API:

1. read the configured branch head;
2. read its commit and base tree;
3. create blobs for changed Markdown and JSON files;
4. create one new tree based on the existing tree;
5. create one commit with the previous head as parent;
6. fast-forward the branch reference without force.

This produces one commit for the entire batch and preserves unrelated repository
files. It follows GitHub's official
[Git database workflow](https://docs.github.com/en/rest/guides/using-the-rest-api-to-interact-with-your-git-database)
and [tree API](https://docs.github.com/en/rest/git/trees).

If another writer advances the branch during a sync, the non-force reference
update fails. The jobs remain queued, allowing the next attempt to rebuild on
the newer head.

## Credentials and privacy

- The token is stored in `chrome.storage.local`.
- It is excluded from JSON exports and generated repository files.
- It is sent only to `https://api.github.com`.
- The manifest requests no broad web host access.
- A token should be limited to one repository and revoked when no longer used.

Browser local storage is not a hardware-backed secret vault. OAuth via a GitHub
App is the preferred future approach for wider distribution, token rotation, and
central revocation.

## Limitations

- The target repository must already contain an initial commit.
- Sync currently targets an existing branch; it does not create repositories or
  branches.
- Changing the destination directory does not remove artifacts previously
  synced to the old directory.
- Background alarms are best-effort browser scheduling, not exact timers.
- Import validates the transfer container but not every nested node field.
