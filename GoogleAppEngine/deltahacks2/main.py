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
		
		user_data = self.user_model.create_user(username, password_raw=password, verified=False)
		if not user_data[0]:
			logging.info('Unable to creaete user for username: %s because of \duplicate keys %s', username, user_data[1])
			return

		self.redirect('/')

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

class EditHandler(BaseHandler):
	@user_required
	def get(self):
		params = {
		}
		self.render_template('edit.html', params)

class GetConditionHandler(BaseHandler):
	@user_required
	def get(self, condition_id):
		condition = Condition.get_by(long(module_id), parent=condition_key(DEFAULT_KEY))

		params = {
			'condition': condition,
		}

		self.response.out.write(json.dump(params))

class AddConditionHandler(BaseHandler):
	@user_required
	def post(self):
		new_condition = Condition(parent=condition_key(DEFAULT_KEY))
		new_condition.title = self.request.get('title')
		new_condition.content = self.request.get('content')
		if self.request.get('parent_id'):
			new_condition.parent_id = int(self.request.get('parent_id'))
		new_condition.type = self.request.get('type')
		new_condition.doctor_id = int(self.user_info['user_id'])
		new_condition.shared = (self.request.get('shared') == 'True')
		new_condition.put()
		self.redirect(self.uri_for('user'))

class EditConditionHandler(BaseHandler):
	@user_required
	def post(self, condition_id):
		condition = Patient.query(parent=condition_key(DEFAULT_KEY)).filter('condition_id = ', condition_id)
		condition.title = self.request.get('title')
		condition.content = self.request.get('content')
		if self.request.get('parent_id'):
			new_condition.parent_id = int(self.request.get('parent_id'))
		condition.shared = self.request.get('shared')
		condition.put()

class DeleteConditionHandler(BaseHandler):
	@user_required
	def get(self, condition_id):
		patient = Patient.query(parent=patient_key(DEFAULT_KEY)).filter('patient_id = ', patient_id)
		patient.key.delete()

class PatientHandler(BaseHandler):
	@user_required
	def get(self, patient_id):
		#conditions = Condition.query(parent=condition_key(DEFAULT_KEY))
		patient = Patient.query(parent=patient_key(DEFAULT_KEY)).filter('patient_id = ', patient_id)
		patient_modules = []
		for module_id in patient.modules:
			patient_modules.append(Condition.get_by(long(module_id), parent=condition_key(DEFAULT_KEY)))

		params = {
			'patient_id': patient.patient_id,
			'patient_name': patient.patient_name,
			'patient_modules': patient_modules,
			'conditions' = sortconditions(conditions),
		}

		self.response.out.write(json.dumps(params))

	def sortconditions(self,conditions):
		conditions_sorted = []
		for e1 in Condition.query(parent=conditions.key(DEFAULT_KEY).filter('parent_id = ', None)).order(-Condition.title)
			conditions_sorted.append(e1)
			 for e2 in Condition.query(parent=conditions.key(DEFAULT_KEY).filter('parent_id = ', e1.id).order(-Condition.title)
			 	if e2 is not None
			 		conditions_sorted.append(e2)
			 	for e3 in Condition.query(parent=conditions.key(DEFAULT_KEY).filter('parent_id = ', e2.id).order(-Condition.title)
			 		if e3 is not None
			 			conditions_sorted.append(e3)


class AddPatientHandler(BaseHandler):
	@user_required
	def post(self):
		new_patient = Patient(parent=patient_key(DEFAULT_KEY))
		new_patient.patient_id = long(self.request.get('patient_id'))
		new_patient.patient_name = self.request.get('patient_name')
		new_patient.doctor_id = int(self.user_info['user_id'])
		new_patient.put()
		self.redirect(self.uri_for('user'))

class EditPatientHandler(BaseHandler):
	@user_required
	def post(self, patient_id):
		patient = Patient.query(parent=patient_key(DEFAULT_KEY)).filter('patient_id = ', patient_id)
		patient_id = self.request.get('patient_id')
		patient.patient_name = self.request.get('patient_name')
		patient.modules = ndb.StringProperty('modules')
		patient.put()

class DeletePatientHandler(BaseHandler):
	@user_required
	def get(self, patient_id):
		patient = Patient.query(parent=patient_key(DEFAULT_KEY)).filter('patient_id = ', patient_id)
		patient.key.delete()

class PatientDocumentHandler(BaseHandler):
	def get(self, patient_id):
		patient = Patient.query(parent=patient_key(DEFAULT_KEY)).filter('patient_id = ', patient_id)
		patient_modules = []
		for module_id in patient.modules:
			patient_modules.append(Condition.get_by(long(module_id), parent=condition_key(DEFAULT_KEY)))

		params = {
			'patient_id': patient.patient_id,
			'patient_name': patient.patient_name,
			'patient_modules': patient_modules,
		}

config = {
	'webapp2_extras.auth': {
		'user_model': 'models.User',
	},
	'webapp2_extras.sessions': {
		'secret_key': 'ksr_secret_password',
	}
}

app = webapp2.WSGIApplication([
    webapp2.Route('/', LoginHandler, name='login'),
    webapp2.Route('/logout', LogoutHandler, name='logout'),
    webapp2.Route('/signup', SignUpHandler),
    
    webapp2.Route('/user', UserHandler, name='user'),
    webapp2.Route('/user/edit', EditHandler),
    webapp2.Route('/user/patient/<patient_id:\d+>', PatientHandler),
    
    webapp2.Route('/user/add/patient', AddPatientHandler),
    webapp2.Route('/user/edit/patient/<patient_id:\d+>', EditPatientHandler),
    webapp2.Route('/user/delete/patient/<patient_id:\d+>', DeletePatientHandler),
    
    webapp2.Route('/user/condition/<condition_id:\d+>', GetConditionHandler),
    webapp2.Route('/user/add/condition', AddConditionHandler),
    webapp2.Route('/user/edit/condition', EditConditionHandler),
    webapp2.Route('/user/delete/condition', DeleteConditionHandler),
    
    webapp2.Route('/patient/<patient_id:\d+>', PatientDocumentHandler),
], debug=True, config=config)


logging.getLogger().setLevel(logging.DEBUG)