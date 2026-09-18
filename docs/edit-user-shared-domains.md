# Editing "shared" on an existing user — backend request

Follow-up to `shared-users-by-domain.md`, which covered **create** only. Sharing can now
be turned on (and scoped) from the **Edit User** modal, on every row in Team Management
(AM) and User Management (SP).

## The flow

1. A user is created normally — say, role `DEVLOPER` under one manager.
2. Later they need to work across departments. The manager opens **Edit User** on that
   row and flips **Shared across managers**.
3. The modal lists **all departments** (`GET /list-domains?isShared=true`, the same call
   the create form makes) and the manager ticks the ones the user should be visible in.
   Departments the user already has come back pre-ticked from `GET /role-sp/user-details`.
4. Save sends the whole set. Every manager in those departments now sees the user.

Turning the toggle **off** sends `is_shared: false` and no `domain_ids`.

## What the modal sends

`PATCH /role-sp/edit-user`

```json
{
  "id": "USR-10023",
  "fullName": "Priya Testing",
  "role": "DEVLOPER",
  "projects": "1,4,9",
  "is_shared": true,
  "domain_ids": ["dom_ab12", "dom_cd34"]
}
```

- `domain_ids` — **replaces** the whole set, as asked for in `shared-users-by-domain.md`
  §3. It is only sent while `is_shared` is true; omit means "leave unchanged".
- The form refuses to save a shared user with zero departments, so `domain_ids` is never
  sent empty. A 400 on that case is still welcome as a backstop.
- `projects` is **not** cleared when sharing is turned on. A developer being widened keeps
  the work already assigned to them — unlike create, where a shared user starts with
  departments only and picks up projects afterwards.

## 1. The guard — the one thing that blocks this

`shared-users-by-domain.md` §3 noted that `/edit-user` is guarded by
`roleGuards.SuperAdmin`, so **an AM cannot change domains after creation**. That is
exactly what this screen now needs, so the guard has to allow an AM on their own team.

Note the guard is already load-bearing beyond sharing: Team Management's Edit User modal
(name, email, role, projects, phone, designation, employment fields, password) has been
calling `PATCH /role-sp/edit-user` as an AM since it shipped. If the SuperAdmin guard is
still in place, none of those saves work for a manager either — please confirm which it is.

## 2. Role of a shared user

Shared staff are never managers, but they **can** be developers. Both forms now offer
`USER` and `DEVLOPER` while shared, and drop `AM`:

- Create: picking **Shared** no longer pins the role to `USER`.
- Edit: sharing an `AM` clears the role so a non-manager one has to be picked.

If the backend assumes `role === "USER"` anywhere for shared users, that assumption needs
to go.

## 3. Still needed from `list-users`

Per `shared-users-by-domain.md` §2, please return `domains` on each row. The modal reads
it for the instant first paint and then replaces it with `user-details`; until it arrives
the departments only appear once `user-details` resolves.
