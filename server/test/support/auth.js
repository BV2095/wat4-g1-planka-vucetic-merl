/*
 * Small helpers shared by the server integration tests.
 *
 * Tests run in Jest worker processes and reach the Sails app (lifted in the
 * parent process by globalSetup) over HTTP via supertest against TEST_BASE_URL.
 */

const request = require('supertest');

const { ADMIN, MEMBER } = require('./fixtures');

const baseUrl = () => process.env.TEST_BASE_URL || 'http://localhost:1337';

// supertest agent bound to the running server.
const api = () => request(baseUrl());

// Performs a real login and returns the raw response (token is in body.item).
const login = (emailOrUsername = ADMIN.username, password = ADMIN.password) =>
  api().post('/api/access-tokens').send({ emailOrUsername, password });

// Returns a valid access token for the given user (defaults to the admin).
const getToken = async (user = ADMIN) => {
  const response = await login(user.username, user.password);
  return response.body.item;
};

// Authorization header for an authenticated request.
const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

module.exports = {
  api,
  login,
  getToken,
  authHeader,
  ADMIN,
  MEMBER,
};
