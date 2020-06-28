# Generated by Django 3.0.7 on 2020-06-28 10:40

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_answerchoice'),
    ]

    operations = [
        migrations.AddField(
            model_name='question',
            name='answer_choices',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.PROTECT, to='api.AnswerChoice'),
            preserve_default=False,
        ),
    ]
