using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using SeatCraft.Application.Abstractions;

namespace SeatCraft.Infrastructure.Pdf;

public sealed class QuestPdfAttendanceSheetGenerator : IAttendanceSheetGenerator
{
    public PdfDocument Generate(AttendanceSheetModel model)
    {
        var bytes = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(28);
                page.DefaultTextStyle(text => text.FontSize(9).FontFamily(Fonts.Calibri));

                page.Header().Column(column =>
                {
                    column.Item().Text("ATTENDANCE SHEET").FontSize(16).SemiBold();
                    column.Item().Text($"{model.ExamTitle} — {model.HallName}").FontSize(11);
                    column.Item().Text(model.ExamDate.ToString("dd MMM yyyy")).FontSize(9).FontColor(Colors.Grey.Darken2);
                });

                page.Content().PaddingTop(12).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(30);
                        columns.ConstantColumn(70);
                        columns.RelativeColumn(3);
                        columns.RelativeColumn(2);
                        columns.ConstantColumn(60);
                        columns.RelativeColumn(2);
                    });

                    table.Header(header =>
                    {
                        HeaderCell(header, "#");
                        HeaderCell(header, "Roll");
                        HeaderCell(header, "Name");
                        HeaderCell(header, "Institution");
                        HeaderCell(header, "Seat");
                        HeaderCell(header, "Signature");
                    });

                    foreach (var row in model.Rows)
                    {
                        BodyCell(table, row.Serial.ToString());
                        BodyCell(table, row.Roll);
                        BodyCell(table, row.CandidateName);
                        BodyCell(table, row.Institution);
                        BodyCell(table, row.SeatLabel);
                        BodyCell(table, string.Empty);
                    }
                });

                page.Footer().AlignRight().Text(text =>
                {
                    text.CurrentPageNumber();
                    text.Span(" / ");
                    text.TotalPages();
                });
            });
        }).GeneratePdf();

        var fileName = $"attendance-{model.HallName.Replace(' ', '-').ToLowerInvariant()}.pdf";

        return new PdfDocument(fileName, bytes);
    }

    private static void HeaderCell(TableCellDescriptor header, string label) =>
        header.Cell().Background(Colors.Grey.Lighten2).Padding(4).Text(label).SemiBold();

    private static void BodyCell(TableDescriptor table, string value) =>
        table.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(4).Text(value);
}
