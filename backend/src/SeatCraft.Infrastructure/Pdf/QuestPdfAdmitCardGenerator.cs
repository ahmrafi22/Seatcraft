using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using SeatCraft.Application.Abstractions;

namespace SeatCraft.Infrastructure.Pdf;

/// <summary>
/// A5 admit card laid out the way an exam centre expects to see one: a header band
/// with the institution and exam, a candidate block with the seat callout, then the
/// instructions and a signature strip.
/// </summary>
public sealed class QuestPdfAdmitCardGenerator : IAdmitCardGenerator
{
    private const string Ink = "#111827";
    private const string Muted = "#4B5563";
    private const string Faint = "#9CA3AF";
    private const string Rule = "#D1D5DB";
    private const string Band = "#F3F4F6";
    private const string Accent = "#0F766E";

    public PdfDocument Generate(AdmitCardModel model)
    {
        var bytes = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A5);
                page.Margin(0);
                page.DefaultTextStyle(text => text.FontSize(9).FontColor(Ink).FontFamily(Fonts.Calibri));

                page.Content().Column(column =>
                {
                    Header(column, model);
                    Body(column, model);
                });

                // A real page footer pins the signature strip to the bottom of the
                // sheet, however much content the card carries.
                page.Footer().PaddingHorizontal(26).PaddingBottom(18).Column(footer =>
                {
                    Footer(footer, model);
                });
            });
        }).GeneratePdf();

        return new PdfDocument($"admit-card-{model.Roll}.pdf", bytes);
    }

    private static void Header(ColumnDescriptor column, AdmitCardModel model)
    {
        column.Item()
            .Background(Accent)
            .PaddingHorizontal(26)
            .PaddingVertical(18)
            .Row(row =>
            {
                row.RelativeItem().Column(left =>
                {
                    left.Item().Text(model.TenantName ?? "SeatCraft")
                        .FontSize(9)
                        .LetterSpacing(0.12f)
                        .FontColor("#CCFBF1");

                    left.Item().PaddingTop(2).Text(model.ExamTitle)
                        .FontSize(15)
                        .SemiBold()
                        .FontColor(Colors.White);
                });

                row.ConstantItem(96).AlignRight().Column(right =>
                {
                    right.Item().AlignRight().Text("ADMIT CARD")
                        .FontSize(11)
                        .Bold()
                        .LetterSpacing(0.08f)
                        .FontColor(Colors.White);

                    right.Item().AlignRight().PaddingTop(2).Text("Bring a photo ID")
                        .FontSize(7.5f)
                        .FontColor("#CCFBF1");
                });
            });
    }

    private static void Body(ColumnDescriptor column, AdmitCardModel model)
    {
        column.Item().PaddingHorizontal(26).PaddingTop(18).Column(content =>
        {
            content.Spacing(0);
            // Candidate identity, with the seat block sitting beside it.
            content.Item().Row(row =>
            {
                // Photo box: real admit cards carry one, and it anchors the layout.
                row.ConstantItem(86).Column(photo =>
                {
                    photo.Item()
                        .Height(104)
                        .Background(Band)
                        .Border(1)
                        .BorderColor(Rule)
                        .AlignCenter()
                        .AlignMiddle()
                        .Text("PHOTO")
                        .FontSize(7)
                        .LetterSpacing(0.08f)
                        .FontColor(Faint);
                });

                row.ConstantItem(16);

                row.RelativeItem(1.35f).Column(details =>
                {
                    details.Spacing(7);

                    Detail(details, "Candidate name", model.CandidateName, 11.5f);
                    Detail(details, "Roll number", model.Roll, 11.5f, mono: true);
                    Detail(details, "Institution", model.Institution);
                    Detail(details, "Subject group", model.SubjectGroup);
                });

                row.ConstantItem(16);

                row.ConstantItem(140).Column(seat =>
                {
                    seat.Item()
                        .Background(Band)
                        .Border(1)
                        .BorderColor(Rule)
                        .Padding(12)
                        .Column(inner =>
                        {
                            inner.Item().Text("SEAT")
                                .FontSize(7.5f)
                                .LetterSpacing(0.1f)
                                .FontColor(Muted);

                            inner.Item().PaddingTop(1).Text(model.SeatLabel)
                                .FontSize(22)
                                .Bold()
                                .FontColor(Accent);

                            inner.Item().PaddingTop(6).Text("HALL")
                                .FontSize(7.5f)
                                .LetterSpacing(0.1f)
                                .FontColor(Muted);

                            inner.Item().PaddingTop(1).Text(model.HallName)
                                .FontSize(10)
                                .SemiBold();

                            if (model.SeatRow is int seatRow && model.SeatColumn is int seatColumn)
                            {
                                inner.Item().PaddingTop(5).Text($"Row {seatRow + 1}  ·  Column {seatColumn + 1}")
                                    .FontSize(7.5f)
                                    .FontColor(Muted);
                            }
                        });
                });
            });

            // Exam date strip.
            content.Item().PaddingTop(16).Row(row =>
            {
                row.RelativeItem().BorderTop(1).BorderColor(Rule).PaddingTop(9).Row(inner =>
                {
                    DateBlock(inner, "Exam date", model.ExamDateLabel ?? model.ExamDate.ToString("dd MMM yyyy"));
                    inner.ConstantItem(18);
                    DateBlock(inner, "Reporting time", "30 min early");
                });
            });

            // Session runs full width: a long description wraps badly in a third column.
            if (!string.IsNullOrWhiteSpace(model.ExamDescription))
            {
                content.Item().PaddingTop(8).Column(session =>
                {
                    session.Item().Text("SESSION")
                        .FontSize(7)
                        .LetterSpacing(0.09f)
                        .FontColor(Muted);

                    session.Item().PaddingTop(1).Text(model.ExamDescription).FontSize(9).SemiBold();
                });
            }

            // Instructions.
            content.Item().PaddingTop(16).Column(notes =>
            {
                notes.Item().Text("INSTRUCTIONS")
                    .FontSize(7.5f)
                    .LetterSpacing(0.1f)
                    .FontColor(Muted);

                notes.Item().PaddingTop(4).Column(list =>
                {
                    list.Spacing(2.5f);
                    Instruction(list, "Carry this admit card and a photo ID to the hall. Entry is refused without both.");
                    Instruction(list, "Report at least 30 minutes before the exam starts.");
                    Instruction(list, "Mobile phones, smart watches and any electronic device are not allowed.");
                    Instruction(list, "Sit only in the seat printed above. Your roll is checked against this card.");
                });
            });
        });
    }

    private static void Footer(ColumnDescriptor column, AdmitCardModel model)
    {
        column.Item().Row(row =>
        {
            row.RelativeItem().Column(sign =>
            {
                sign.Item().Width(130).LineHorizontal(0.8f).LineColor(Faint);
                sign.Item().PaddingTop(4).Text("Candidate signature").FontSize(7.5f).FontColor(Muted);
            });

            row.RelativeItem().AlignRight().Column(sign =>
            {
                sign.Item().AlignRight().Width(130).LineHorizontal(0.8f).LineColor(Faint);
                sign.Item().PaddingTop(4).AlignRight().Text("Controller of examinations").FontSize(7.5f).FontColor(Muted);
            });
        });

        column.Item().PaddingTop(10).Text(text =>
        {
            text.Span($"{model.Roll} · ").FontSize(7).FontColor(Faint);
            text.Span("Generated by SeatCraft. Verify the seat at the public lookup portal.").FontSize(7).FontColor(Faint);
        });
    }

    private static void Detail(
        ColumnDescriptor column,
        string label,
        string value,
        float size = 10,
        bool mono = false)
    {
        column.Item().Column(item =>
        {
            item.Item().Text(label.ToUpperInvariant())
                .FontSize(7)
                .LetterSpacing(0.09f)
                .FontColor(Muted);

            item.Item().PaddingTop(1).Text(value)
                .FontSize(size)
                .SemiBold()
                .FontFamily(mono ? Fonts.Consolas : Fonts.Calibri);
        });
    }

    private static void DateBlock(RowDescriptor row, string label, string value)
    {
        row.RelativeItem().Column(block =>
        {
            block.Item().Text(label.ToUpperInvariant())
                .FontSize(7)
                .LetterSpacing(0.09f)
                .FontColor(Muted);

            block.Item().PaddingTop(1).Text(value).FontSize(9.5f).SemiBold();
        });
    }

    private static void Instruction(ColumnDescriptor list, string text) =>
        list.Item().Row(row =>
        {
            row.ConstantItem(9).Text("•").FontSize(8).FontColor(Faint);
            row.RelativeItem().Text(text).FontSize(8).FontColor(Muted).LineHeight(1.35f);
        });
}
