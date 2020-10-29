const config = require("./config");
const User = require("./functions/user");

module.exports = (firebaseAdmin) => {
  const utils = require("@fariamedia/firebase-utils")(firebaseAdmin);
  const auth = firebaseAdmin.auth();

  return {
    user: User(
      auth,
      utils,
      options.user ? Object.assign({}, config.user, options.user) : config.user
    ),
  };
};
