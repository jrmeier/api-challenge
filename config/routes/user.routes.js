const _ = require("lodash");
const routeUtils = require("./utils.route.js");
const User = require("../../models/user.js");

module.exports = [
  // Read self
  {
    method: "GET",
    path: "/users/self",
    config: {
      description: "Read a user",
      tags: ["Users"],
    },
    handler: async (request, h) => {
      try {
        const { user } = request.auth.credentials;
        const res = await user.findComplete();
        return routeUtils.replyWith.found(res, h);
      } catch (err) {
        return routeUtils.handleErr(err, h);
      }
    },
  },
  {
    method: "GET",
    path: "/users/{id}",
    config: {
      description: "Read a user",
      tags: ["Users"],
    },
    handler: async (request, h) => {
      try {
        const { id } = request.params;
        const { user } = request.auth.credentials;
        const userComplete = await user.findComplete();

        if(!userComplete){
          return routeUtils.replyWith.notFound(h);
        }
        const authedUser = await user.findComplete()

 
        if (authedUser.roles.includes('admin')) {
          const userWithId = await User.findByPk(id)
          const res = await userWithId.findComplete();
          return res

        }

        return routeUtils.replyWith.unauthorized(h);

      } catch (err) {
        return routeUtils.handleErr(err, h);
      }
    }
  }
];
