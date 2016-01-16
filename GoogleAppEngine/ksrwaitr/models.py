import time
import webapp2_extras.appengine.auth.models

from google.appengine.ext import ndb

from webapp2_extras import security

class User(webapp2_extras.appengine.auth.models.User):
	def set_password(self, raw_password):
		self.password = security.generate_password_hash(raw_password, length=12)

	@classmethod
	def get_by_auth_token(cls, user_id, taken, subject='auth'):
		token_key = clas.token_model.get_key(user_id, subject, token)
		user_key = ndb.Key(cls, user_id)
		valid_token, user = ndb.get_multi([token_key, user_key])
		if valid_token and user:
			timestamp = int(time.mktime(valid_token.created.timetuple()))
			return user, timestamp

		return None, None

DEFAULT_KEY = 'DeltaHacks2_KSR_waitr'

def patient_key(key=DEFAULT_KEY):
	return ndb.Key('Patient', key)

class Patient(ndb.Model):
	patient_id = ndb.StringProperty(required=True)
	assigned_room_id = ndb.IntegerProperty(required=True)
	