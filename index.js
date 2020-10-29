const config = require("./config");
const User = require("./functions/user");

module.exports = (firebaseAdmin, options = {}) => {
  if (!firebaseAdmin) throw Error("Firebase Admin SDK is missing");

  const utils = require("@fariamedia/firebase-utils")(firebaseAdmin);
  const auth = firebaseAdmin.auth();

  const userConfig = options.user
    ? Object.assign({}, config.user, options.user)
    : config.user;

  return {
    user: User(auth, utils, Object.assign({}, config, userConfig)),
  };
};
