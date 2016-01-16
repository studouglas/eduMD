#!/usr/bin/env python
# -*- coding: utf-8 -*-

from google.appengine.ext import ndb

from google.appengine.ext.webapp import template

import datetime
import logging
import os.path
import webapp2

import urllib
import base64
import json

from webapp2_extras import auth
from webapp2_extras import sessions

from webapp2_extras.auth import InvalidAuthIdError
from webapp2_extras.auth import InvalidPasswordError

from models import *

def user_required(handler):
	"""
		Decorator that checks if there's a user associated with the current session.
		Will also fail if there's no session present.
	"""
	def check_login(self, *args, **kwargs):
		auth = self.auth
		if not auth.get_user_by_session():
			self.redirect(self.uri_for('login'), abort=True)
		else:
			return handler(self, *args, **kwargs)

	return check_login

class BaseHandler(webapp2.RequestHandler):
	@webapp2.cached_property
	def auth(self):
		"""
			Shortcut to access the auth instance as a property.
		"""
		return auth.get_auth()

	@webapp2.cached_property
	def user_info(self):
		"""
			Shortcut to access a subset of the user attributes that are stored in the session.

			The list of attributes to store in the session is specified in config['webapp2_extras.auth']['user_attributes'].

			:returns
				A dictionary with most user information
		"""
		return self.auth.get_user_by_session()

	@webapp2.cached_property
	def user(self):
		"""
			Shortcut to access the current logged in user.

			Unlike user_info, it fetches information from the persistence layer and returns an instance of the underlying model.

			:returns
				The instance of the user model associated to the logged in user.
		"""
		u = self.user_info
		return self.user_model.get_by_id(u['user_id']) if u else None

	@webapp2.cached_property
	def user_model(self):
		"""
			Returns the implementation of the user model.

			It is consistent with config['webapp2_extras.auth']['user_model'], if set.
		"""
		return self.auth.store.user_model

	@webapp2.cached_property
	def session(self):
		"""
			Shortcut to access the current session.
		"""
		return self.session_store.get_session(backend="datastore")

	def render_template(self, view_filename, params=None):
		if not params:
			params = {}
		user = self.user_info
		params['user'] = user
		path = os.path.join(os.path.dirname(__file__), 'view', view_filename)
		self.response.out.write(template.render(path, params))
	
	# This is needed for webapp2 sessions to work
	def dispatch(self):
		# Get a session
		self.session_store = sessions.get_store(request=self.request)

		try:
			# Dispatch the request.
			webapp2.RequestHandler.dispatch(self)
		finally:
			# Save all sessions.
			self.session_store.save_sessions(self.response)

class LoginHandler(BaseHandler):
	def get(self):
		self._serve_page()

	def post(self):
		username = self.request.get('username')
		password = self.request.get('password')
		try:
			u = self.auth.get_user_by_password(username, password, remember=False)
			if not self.user.verified:
				self.auth.unset_session()
				self._serve_page(True)
				return
			self.redirect(self.uri_for('user'))
		except (InvalidAuthIdError, InvalidPasswordError) as e:
			logging.info('Login failed for user %s because of %s', username, type(e))
			self._serve_page(True)

	def _serve_page(self, failed=False):
		username = self.request.get('username')
		params = {
			'username': username,
			'failed':	failed
		}
		self.render_template('login.html', params)

class SignUpHandler(BaseHandler):
	def get(self):
		self.render_template('signup.html')

	def post(self):
		username = self.request.get('username')
		password = self.request.get('password')

		user_data = self.user_model.create_user(username, password_raw=password, verified=True)
		if not user_data[0]:
			logging

class LogoutHandler(BaseHandler):
	def get(self):
		self.auth.unset_session()
		self.redirect(self.uri_for('login'))

class UserHandler(BaseHandler):
	@user_required
	def get(self):
		params = {		
		}
		self.render_template('user.html', params)

config = {
	'webapp2_extras.auth': {
		'user_model': 'models.User',
	},
	'webapp2_extras.sessions': {
		'secret_key': 'ksr_waitr_secret_password',
	}
}

app = webapp2.WSGIApplication([
    webapp2.Route('/', LoginHandler, name='login'),
    webapp2.Route('/logout', LogoutHandler, name='logout'),
    webapp2.Route('/signup', SignUpHandler),
    webapp2.Route('/user', UserHandler, name='user'),
], debug=True, config=config)


logging.getLogger().setLevel(logging.DEBUG)