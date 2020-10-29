const cors = require("cors")({ origin: true });

module.exports = (auth, utils, config) => {
  const { appTitle } = config;
  const {
    usersCollection,
    verifyEmailTemplate,
    verifyEmailRedirect,
    welcomeEmailTemplate,
    settings,
  } = config.user;
  const { firestore, mail } = utils;

  const actionCodeSettings = {
    url: verifyEmailRedirect,
  };

  /**
   * createAccount
   * @param {UserRecord} user
   */
  const createAccount = async (user, extraFields = {}) => {
    const { uid, email, displayName } = user;
    const data = Object.assign(
      {},
      {
        firstName: displayName || "",
        email,
        settings,
      },
      extraFields
    );
    return firestore.saveDoc(usersCollection, uid, data);
  };

  /**
   * sendWelcomeEmail
   * @param {UserRecord} user
   */
  const sendWelcomeEmail = async (user, emailOptions = {}) => {
    // Set email to address
    emailOptions.to = user.email;

    // Generate verification link
    try {
      const link = await auth.generateEmailVerificationLink(
        user.email,
        actionCodeSettings
      );

      const data = {
        appTitle: appTitle,
        link,
        displayName: user.displayName || user.email,
      };

      // Send mail
      return mail.sendMailWithTemplate(
        emailOptions,
        welcomeEmailTemplate,
        data
      );
    } catch (error) {
      return error;
    }
  };

  /**
   * sendVerifyEmail
   * @param {Request} req
   * @param {Response} res
   */
  const sendVerifyEmail = (req, res, emailOptions = {}) => {
    return cors(req, res, async () => {
      if (req.method !== "POST" || !req.body.email) return res.status(403);

      // Get user
      const userRes = await auth.getUserByEmail(req.body.email);
      if (!userRes) {
        return res.status(404).send("User not found");
      }
      const user = userRes.toJSON();

      // Set email to address
      emailOptions.to = user.email;

      // Generate verification link
      try {
        const link = await auth.generateEmailVerificationLink(
          user.email,
          actionCodeSettings
        );

        const data = {
          appTitle: appTitle,
          link,
          displayName: user.displayName || user.email,
        };

        // Send mail
        return mail.sendMailWithTemplate(
          emailOptions,
          verifyEmailTemplate,
          data,
          () => {
            return res
              .status(200)
              .send(`Email sent successfully to ${user.email}`);
          }
        );
      } catch (error) {
        return res.status(500).send(error);
      }
    });
  };

  /**
   * checkIfVerified
   * @param {Request} req
   * @param {Response} res
   */
  const checkIfVerified = (req, res) => {
    return cors(req, res, async () => {
      if (req.method !== "POST") return res.status(403).send("Post only");
      const { email } = req.body;
      try {
        const user = await auth.getUserByEmail(email);
        if (!user) {
          return res.status(404).send("User not found");
        }
        const data = user.toJSON();
        return res.status(200).send(data.emailVerified);
      } catch (error) {
        console.error(error);
        return res.status(500).send(error);
      }
    });
  };

  return {
    onCreate: {
      createAccount,
      sendWelcomeEmail,
    },
    httpRequest: {
      sendVerifyEmail,
      checkIfVerified,
    },
  };
};
