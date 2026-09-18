using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using SeatCraft.Application.Abstractions;

namespace SeatCraft.Infrastructure.Pdf;

public sealed class QuestPdfAdmitCardGenerator : IAdmitCardGenerator
{
    public PdfDocument Generate(AdmitCardModel model)
    {
        var bytes = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A5);
                page.Margin(24);
                page.DefaultTextStyle(text => text.FontSize(10).FontFamily(Fonts.Calibri));

                page.Header().Column(column =>
                {
                    column.Item().Text("ADMIT CARD").FontSize(18).SemiBold().FontColor(Colors.Blue.Darken2);
                    column.Item().Text(model.ExamTitle).FontSize(12).Medium();
                    column.Item().PaddingTop(4).LineHorizontal(1).LineColor(Colors.Grey.Medium);
                });

                page.Content().PaddingVertical(14).Column(column =>
                {
                    column.Spacing(6);

                    Field(column, "Candidate", model.CandidateName);
                    Field(column, "Roll", model.Roll);
                    Field(column, "Institution", model.Institution);
                    Field(column, "Subject group", model.SubjectGroup);
                    Field(column, "Exam date", model.ExamDate.ToString("dd MMM yyyy"));

                    column.Item().PaddingTop(8).Background(Colors.Blue.Lighten4).Padding(10).Row(row =>
                    {
                        row.RelativeItem().Column(detail =>
                        {
                            detail.Item().Text("HALL").FontSize(9).FontColor(Colors.Grey.Darken2);
                            detail.Item().Text(model.HallName).FontSize(14).SemiBold();
                        });

                        row.RelativeItem().Column(detail =>
                        {
                            detail.Item().Text("SEAT").FontSize(9).FontColor(Colors.Grey.Darken2);
                            detail.Item().Text(model.SeatLabel).FontSize(14).SemiBold();
                        });
                    });

                    column.Item().PaddingTop(10).Text(text =>
                    {
                        text.Span("Instructions: ").SemiBold();
                        text.Span("Bring this admit card and a photo ID. Report 30 minutes before the exam starts. Mobile phones are not allowed inside the hall.");
                    });
                });

                page.Footer().AlignCenter().Text(text =>
                {
                    text.CurrentPageNumber();
                    text.Span(" / ");
                    text.TotalPages();
                });
            });
        }).GeneratePdf();

        return new PdfDocument($"admit-card-{model.Roll}.pdf", bytes);
    }

    private static void Field(ColumnDescriptor column, string label, string value) =>
        column.Item().Row(row =>
        {
            row.ConstantItem(110).Text(label).FontColor(Colors.Grey.Darken2);
            row.RelativeItem().Text(value).SemiBold();
        });
}
