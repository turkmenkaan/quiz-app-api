from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Question, AnswerChoice

class QuestionSerializer(serializers.HyperlinkedModelSerializer):

    class Meta:
        model = Question
        fields = '__all__'

class AnswerChoiceSerializer(serializers.HyperlinkedModelSerializer):

    class Meta:
        model = AnswerChoice
        fields = '__all__'

class UserSerializer(serializers.HyperlinkedModelSerializer):

    class Meta:
        model = User
        fields = ('username', 'email', 'id')