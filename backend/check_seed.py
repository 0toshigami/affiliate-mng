import inspect
from app.utils.seed import seed_admin_user

# Print the source code of seed_admin_user to verify the fix
print("Current seed_admin_user function:")
print(inspect.getsource(seed_admin_user))
