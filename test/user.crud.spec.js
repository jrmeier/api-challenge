"use strict";

const _ = require("lodash");
const { expect } = require("chai");
const { server } = require("./config/test.server.js");
const sequelize = require("../config/sequelize/setup.js");
const Test = require("./config/test.utils.js");

const uri = `${server.info.uri}/v0`;
const scope = {};

describe("User CRUD operations -", () => {
  before(async () => {
    await Test.setupDb();
    return Promise.resolve();
  });

  describe("GET /users/{userId}", () => {
    it("should read a given user's information if requester is an admin", async () => {
      // Create a user and a JWT access token for that user

      scope.owner = await sequelize.models.User.create({
        email: `owner@example.com`,
      });
      scope.owner.accessToken = await scope.owner.generateAccessToken();

      await Test.assignRoleForUser({
        user: scope.owner,
        roleName: "owner",
      });

      scope.admin = await sequelize.models.User.create({
        email: 'admin@example.com',
      });

      scope.admin.accessToken = await scope.admin.generateAccessToken();

      await Test.assignRoleForUser({
        user: scope.admin,
        roleName: "admin",
      });


      const { statusCode, result } = await server.inject({
        method: "get",
        url: `${uri}/users/${scope.owner.id}`,
        headers: {
          authorization: `Bearer ${scope.admin.accessToken}`,
        },
      });

      // Assert a proper response
      expect(statusCode).to.equal(200);
      expect(result.id).to.equal(scope.owner.id);
      expect(result.uuid).to.equal(scope.owner.uuid);
      expect(result.email).to.equal(scope.owner.email);
      expect(result.roles.length).to.equal(1);
      expect(result.roles).to.have.members(["owner"]);

      return Promise.resolve();
    });


    it("should return 401 unauthorized if requester is not an admin", async () => {

      // Create a user and a JWT access token for that user
      scope.member = await sequelize.models.User.create({
        email: 'member@example.com',
      });

      scope.member.accessToken = await scope.member.generateAccessToken();

      await Test.assignRoleForUser({
        user: scope.member,
        roleName: "member",
      });

      scope.owner = await sequelize.models.User.create({
        email: 'owner@example.com',
      });

      await Test.assignRoleForUser({
        user: scope.owner,
        roleName: "owner",
      });

      scope.owner.accessToken = await scope.owner.generateAccessToken();

      const { statusCode, result } = await server.inject({
        method: "get",
        url: `${uri}/users/${scope.member.id}`,
        headers: {
          authorization: `Bearer ${scope.owner.accessToken}`, // the owner is making the request but isn't an admin
        },
      });

      // Assert a proper response
      expect(statusCode).to.equal(401);
      return Promise.resolve();
    });
  });

  describe("GET /self", () => {
    it("should read own information", async () => {
      // Create a user and a JWT access token for that user
      scope.user = await sequelize.models.User.create({
        email: `user@example.com`,
      });
      scope.accessToken = await scope.user.generateAccessToken();

      // Add 2 roles to the user
      await Test.assignRoleForUser({
        user: scope.user,
        roleName: "owner",
      });
      await Test.assignRoleForUser({
        user: scope.user,
        roleName: "member",
      });

      // Make the request
      const { statusCode, result } = await server.inject({
        method: "get",
        url: `${uri}/users/self`,
        headers: {
          authorization: `Bearer ${scope.accessToken}`,
        },
      });

      // Assert a proper response
      expect(statusCode).to.equal(200);
      expect(result.id).to.equal(scope.user.id);
      expect(result.uuid).to.equal(scope.user.uuid);
      expect(result.email).to.equal(scope.user.email);
      expect(result.roles.length).to.equal(2);
      expect(result.roles).to.have.members(["owner", "member"]);

      return Promise.resolve();
    });
  });
});
