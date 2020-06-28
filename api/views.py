
import random

from django.http import HttpResponse

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Question, AnswerChoice
from .serializers import (
    QuestionSerializer, AnswerChoiceSerializer, UserSerializer
)

# Create your views here.
class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all().order_by('point')
    serializer_class = QuestionSerializer

    # TODO: Change permission class to restrict access to authenticated users
    # once authentication system is built. (permission_classes=[IsAuthenticated])
    @action(methods=['GET'], detail=False, permission_classes=[AllowAny],
    url_name="get_random", url_path="get-random")
    def get_random(self, request):
        """ Returns a random question to the users """
        key = random.randint(1, Question.objects.count())
        queryset = Question.objects.get(pk=key)
        serializer = QuestionSerializer(queryset)
        return Response(serializer.data)

    # TODO: Change permission class to restrict access to authenticated users
    # once authentication system is built. (permission_classes=[IsAuthenticated])
    @action(methods=['POST'], detail=True, permission_classes=[AllowAny])
    def answer(self, request, pk=None):
        """ Returns the answer of the specified question """
        correct_answer = self.get_object().correct_answer.id
        user_answer_id = int(request.data['answer_id'])

        if correct_answer == user_answer_id:
            # User sent the correct answer
            return Response("Correct Answer!") 
        else:
            # User sent the wrong answer
            return Response("Wrong Answer!")


class AnswerChoicesViewSet(viewsets.ModelViewSet):
    queryset = AnswerChoice.objects.all()
    serializer_class = AnswerChoiceSerializer

# TODO: Fetching all users is dangerous and only done for development reasons
# Must be changed before production
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer