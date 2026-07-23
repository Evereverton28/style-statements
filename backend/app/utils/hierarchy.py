"""Account-creation hierarchy — the single source of truth.

    super_admin -> may create/edit/deactivate/delete: manager, staff
    manager     -> may create/edit/deactivate/delete: staff
    staff       -> may manage nobody
    customer    -> self-registration only (never created by an admin)

Enforced server-side on every request. The frontend hides unauthorised actions
for convenience only; this module is the actual boundary.
"""

MANAGEABLE = {
    "super_admin": ("manager", "staff"),
    "manager": ("staff",),
    "staff": (),
    "customer": (),
}

# Roles that may be created through the admin panel at all.
ADMIN_CREATABLE = ("manager", "staff")


def can_manage(actor_role, target_role):
    """True if actor_role may create/edit/deactivate/delete target_role."""
    return target_role in MANAGEABLE.get(actor_role, ())


def manageable_roles(actor_role):
    """Roles this actor is allowed to assign — drives the frontend dropdown."""
    return list(MANAGEABLE.get(actor_role, ()))
