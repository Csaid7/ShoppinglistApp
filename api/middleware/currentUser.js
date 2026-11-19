// Dev-only stand-in for login. Attaches a fixed user to every request so the
// routes can read req.user.householdId. Replaced by real auth in Milestone 3.

if (process.env.NODE_ENV === 'production') {
  throw new Error('currentUser dev middleware must not run in production');
}

function currentUser(req, res, next) {
  req.user = { id: 1, householdId: 1 }; // Caleb, "Caleb's family" (see seed.js)
  next();
}

module.exports = currentUser;
