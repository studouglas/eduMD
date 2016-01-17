import time
import webapp2_extras.appengine.auth.models

from google.appengine.ext import ndb

from webapp2_extras import security

class User(webapp2_extras.appengine.auth.models.User):
	def set_password(self, raw_password):
		self.password = security.generate_password_hash(raw_password, length=12)

	@classmethod
	def get_by_auth_token(cls, user_id, token, subject='auth'):
		token_key = cls.token_model.get_key(user_id, subject, token)
		user_key = ndb.Key(cls, user_id)
		valid_token, user = ndb.get_multi([token_key, user_key])
		if valid_token and user:
			timestamp = int(time.mktime(valid_token.created.timetuple()))
			return user, timestamp

		return None, None

DEFAULT_KEY = 'DeltaHacks2_KSR'

def patient_key(key=DEFAULT_KEY):
	return ndb.Key('Patient', key)

class Patient(ndb.Model):
	patient_id = ndb.IntegerProperty(required=True)
	patient_name = ndb.StringProperty(required=True)
	modules = ndb.StringProperty()
	doctor_id = ndb.IntegerProperty(required=True)

def condition_key(key=DEFAULT_KEY):
	return ndb.Key('Condition', key)

class Condition(ndb.Model):
	title = ndb.StringProperty(required=True)
	content = ndb.TextProperty()
	parent_id = ndb.IntegerProperty()
	data_type = ndb.StringProperty(default='txt')
	doctor_id = ndb.IntegerProperty(required=True)
	shared = ndb.BooleanProperty(required=True, default=True)