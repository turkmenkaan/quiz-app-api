# Generated by Django 3.0.7 on 2020-06-28 12:02

from django.db import migrations


def create_questions(apps, schema_editor):
    Question = apps.get_model('api', 'Question')

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_question_answer_choices'),
    ]

    operations = [
    ]
