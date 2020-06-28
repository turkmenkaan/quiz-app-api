from django.db import models
from django.contrib.postgres.fields import ArrayField


class AnswerChoice(models.Model):
    text = models.CharField(max_length=100)

    def __str__(self):
        return self.text

class Question(models.Model):
    prompt = models.CharField(max_length=300)
    point = models.IntegerField()
    choices = models.ManyToManyField(AnswerChoice)
    correct_answer = models.ForeignKey('AnswerChoice', on_delete=models.PROTECT, related_name='correct_answer')

    def __str__(self):
        return self.prompt