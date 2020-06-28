from django.db import models

# Create your models here.
class Question(models.Model):
    prompt = models.CharField(max_length=300)
    point = models.IntegerField()
    answer_choices = models.ForeignKey('AnswerChoice', on_delete=models.PROTECT)

    def __str__(self):
        return self.prompt

class AnswerChoice(models.Model):
    text = models.CharField(max_length=100)

    def __str__(self):
        return self.text