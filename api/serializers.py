from rest_framework import serializers
from .models import Question, AnswerChoice

class QuestionSerializer(serializers.HyperlinkedModelSerializer):

    class Meta:
        model = Question
        fields = ('prompt', 'point')

class AnswerChoiceSerializer(serializers.HyperlinkedModelSerializer):

    class Meta:
        model = AnswerChoice
        fields = '__all__'