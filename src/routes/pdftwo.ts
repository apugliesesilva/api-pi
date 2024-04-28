import { FastifyRequest, FastifyReply } from 'fastify';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';

const prisma = new PrismaClient();

export async function obterDados(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { courseId } = request.params as { courseId: string };

    // Consultar o banco de dados para obter todos os ratings associados ao courseId
    const ratings = await prisma.rating.findMany({
      where: {
        subject: {
          course: {
            id: courseId,
          },
        },
      },
      include: {
        subject: true,
      },
    });

    // Objeto para armazenar as métricas por sentence
    const metricsBySentence: Record<string, {
      averageScore: number;
      scoreDistribution: Record<number, number>;
      numberOfResponses: number;
      percentageByScore: Record<number, number>;
    }> = {};

    // Iterar sobre os ratings e calcular as métricas por sentence
    ratings.forEach((rating: any) => {
      const { sentence, score } = rating;
      const { name } = rating.subject;

      // Inicializar as métricas se ainda não estiverem presentes
      if (!metricsBySentence[sentence]) {
        metricsBySentence[sentence] = {
          averageScore: 0,
          scoreDistribution: {
            0: 0,
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
          },
          numberOfResponses: 0,
          percentageByScore: {
            0: 0,
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
          },
        };
      }

      // Atualizar as métricas com base no rating atual
      metricsBySentence[sentence].averageScore += score;
      metricsBySentence[sentence].scoreDistribution[score]++;
      metricsBySentence[sentence].numberOfResponses++;
    });

    // Calcular a média dos scores e a porcentagem por score para cada sentence
    Object.keys(metricsBySentence).forEach((sentence) => {
      const { averageScore, scoreDistribution, numberOfResponses } = metricsBySentence[sentence];

      // Calcular a média dos scores
      metricsBySentence[sentence].averageScore = averageScore / numberOfResponses;

      // Calcular a porcentagem por score
      Object.keys(scoreDistribution).forEach((score) => {
        const count = scoreDistribution[parseInt(score)];
        metricsBySentence[sentence].percentageByScore[parseInt(score)] = (count / numberOfResponses) * 100;
      });
    });

    // Gerar o PDF
    const doc = new PDFDocument();
    const filename = `rating_metrics_course_${courseId}.pdf`;
    const stream = fs.createWriteStream(filename);

    doc.pipe(stream);

    // Adicionar cabeçalho ao PDF
    doc.fontSize(12).text('UNIVERSIDADE CATÓLICA DE PERNAMBUCO');
    doc.text('SISTEMA DE AVALIAÇÃO');
    doc.text('RESULTADO DA AVALIAÇÃO DISCENTE 2024.1');
    doc.text('ICAM-TECH');
    doc.text('CURSO DE SISTEMAS PARA INTERNET');
    doc.text('RELATÓRIO DO SISTEMA DE AVALIAÇÃO');
    doc.moveDown();
    doc.moveDown();
    doc.fontSize(14).text('Manifeste o seu grau de concordância com as afirmações a seguir, referentes à maioria dos professores deste semestre segundo a escala que apresenta uma variação de 1 (discordo totalmente) a 5 (concordo plenamente).');
    doc.moveDown();
    doc.moveDown();
    // Adicionar as métricas ao PDF
    Object.entries(metricsBySentence).forEach(([sentence, metrics]) => {
      doc.moveDown();
      doc.font('Helvetica-Bold').text(`${sentence}`);
      doc.text(`Média: ${metrics.averageScore.toFixed(2)}% - Participação: ${metrics.numberOfResponses}`);
      doc.moveDown();
      Object.entries(metrics.scoreDistribution).forEach(([score, count]) => {
        doc.text(`${score}: ${count}`);
      });
      doc.moveDown();
    });
    doc.end();

    // Enviar o PDF como resposta
    reply.header('Content-Disposition', `attachment; filename="${filename}"`);
    reply.type('application/pdf').send(fs.readFileSync(filename));
  } catch (error) {
    console.error('Error fetching rating metrics by sentence:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
}
