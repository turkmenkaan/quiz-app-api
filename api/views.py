from rest_framework import viewsets

from .serializers import QuestionSerializer, AnswerChoiceSerializer
from .models import Question, AnswerChoice

# Create your views here.
class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all().order_by('point')
    serializer_class = QuestionSerializer

class AnswerChoicesViewSet(viewsets.ModelViewSet):
    queryset = AnswerChoice.objects.all()
    serializer_class = AnswerChoiceSerializer