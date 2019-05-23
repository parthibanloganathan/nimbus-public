from flask import Flask
from config import Config
from flask_heroku import Heroku

app = Flask(__name__)
app.config.from_object(Config)
heroku = Heroku(app)
