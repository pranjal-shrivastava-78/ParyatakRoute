import io
from typing import Any, Optional
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.schemas.itinerary import ItineraryResponse
from app.schemas.trip import TripResponse


class PDFService:
    def generate_itinerary_pdf(self, itinerary: Any, trip: Optional[Any] = None) -> bytes:
        # Normalize itinerary if dict
        if isinstance(itinerary, dict):
            itinerary = ItineraryResponse(**itinerary)

        # Normalize trip fallback
        destination = "Custom Itinerary"
        duration_days = len(itinerary.days)
        start_date = itinerary.days[0].date if itinerary.days else "TBD"
        end_date = itinerary.days[-1].date if itinerary.days else "TBD"
        travel_style = "Leisure"
        currency = itinerary.budget.currency
        budget = itinerary.budget.total_estimated
        travellers = 1

        if trip is not None:
            destination = getattr(trip, "destination", None) or (trip.get("destination") if isinstance(trip, dict) else destination)
            duration_days = getattr(trip, "duration_days", duration_days) or (trip.get("duration_days") if isinstance(trip, dict) else duration_days)
            start_date = getattr(trip, "start_date", start_date) or (trip.get("start_date") if isinstance(trip, dict) else start_date)
            end_date = getattr(trip, "end_date", end_date) or (trip.get("end_date") if isinstance(trip, dict) else end_date)
            travel_style = getattr(trip, "travel_style", travel_style) or (trip.get("travel_style") if isinstance(trip, dict) else travel_style)
            currency = getattr(trip, "currency", currency) or (trip.get("currency") if isinstance(trip, dict) else currency)
            budget = getattr(trip, "budget", budget) or (trip.get("budget") if isinstance(trip, dict) else budget)
            travellers = getattr(trip, "travellers", travellers) or (trip.get("travellers") if isinstance(trip, dict) else travellers)

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=36,
            title=f"ParyatakRoute Itinerary - {itinerary.title}",
            author="ParyatakRoute",
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Title"],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor("#1E293B"),
            alignment=1, # Center
        )
        subtitle_style = ParagraphStyle(
            "Subtitle",
            parent=styles["Normal"],
            fontSize=11,
            leading=15,
            textColor=colors.HexColor("#475569"),
            alignment=1,
        )
        h2_style = ParagraphStyle(
            "H2",
            parent=styles["Heading2"],
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#0F172A"),
            spaceBefore=12,
            spaceAfter=6,
        )
        body_style = ParagraphStyle(
            "Body",
            parent=styles["Normal"],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#334155"),
        )
        activity_title_style = ParagraphStyle(
            "ActTitle",
            parent=styles["Normal"],
            fontSize=10,
            leading=13,
            textColor=colors.HexColor("#0284C7"),
            fontName="Helvetica-Bold",
        )

        story = []

        # 1. Header Banner
        story.append(Paragraph("ParyatakRoute — Travel Itinerary", title_style))
        story.append(Spacer(1, 4))
        story.append(Paragraph(f"<b>{itinerary.title}</b> | {destination}", subtitle_style))
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#CBD5E1"), spaceAfter=12))

        # 2. Trip Overview Table
        overview_data = [
            [Paragraph("<b>Destination:</b>", body_style), Paragraph(str(destination), body_style),
             Paragraph("<b>Duration:</b>", body_style), Paragraph(f"{duration_days} Days", body_style)],
            [Paragraph("<b>Dates:</b>", body_style), Paragraph(f"{start_date} to {end_date}", body_style),
             Paragraph("<b>Travel Style:</b>", body_style), Paragraph(str(travel_style).capitalize(), body_style)],
            [Paragraph("<b>Budget:</b>", body_style), Paragraph(f"{currency} {float(budget):,.2f}", body_style),
             Paragraph("<b>Travellers:</b>", body_style), Paragraph(str(travellers), body_style)],
        ]
        overview_table = Table(overview_data, colWidths=[80, 180, 80, 180])
        overview_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(overview_table)
        story.append(Spacer(1, 12))

        # 3. Summary
        if itinerary.summary:
            story.append(Paragraph("<b>Trip Overview:</b>", h2_style))
            story.append(Paragraph(itinerary.summary, body_style))
            story.append(Spacer(1, 10))

        # 4. Day-by-Day Schedule
        story.append(Paragraph("Day-by-Day Plan", h2_style))
        for day in itinerary.days:
            theme_text = f" — {day.theme}" if day.theme else ""
            story.append(Paragraph(f"<b>Day {day.day_number} ({day.date}){theme_text}</b>", ParagraphStyle(
                "DayHeader",
                parent=body_style,
                fontSize=11,
                fontName="Helvetica-Bold",
                textColor=colors.HexColor("#1E293B"),
                spaceBefore=6,
                spaceAfter=4,
            )))

            act_rows = [[Paragraph("<b>Time</b>", body_style), Paragraph("<b>Activity</b>", body_style), Paragraph("<b>Est. Cost</b>", body_style)]]
            for act in day.activities:
                time_str = act.start_time or "--:--"
                act_detail = f"<b>{act.name}</b> ({act.duration_minutes}m)<br/>{act.description}"
                if act.location and act.location.name:
                    act_detail += f"<br/><i>Location: {act.location.name}</i>"
                cost_str = f"{act.cost_currency} {act.estimated_cost:,.2f}"
                act_rows.append([Paragraph(time_str, body_style), Paragraph(act_detail, body_style), Paragraph(cost_str, body_style)])

            act_table = Table(act_rows, colWidths=[55, 390, 75])
            act_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
                ("LINEBELOW", (0, 0), (-1, 0), 1, colors.HexColor("#CBD5E1")),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]))
            story.append(act_table)
            story.append(Spacer(1, 8))

        # 5. Budget Breakdown
        story.append(Spacer(1, 10))
        story.append(Paragraph("Estimated Budget Breakdown", h2_style))
        b = itinerary.budget
        cats = b.categories
        budget_rows = [
            [Paragraph("<b>Category</b>", body_style), Paragraph("<b>Estimated Amount</b>", body_style)],
            [Paragraph("Transport", body_style), Paragraph(f"{b.currency} {cats.transport:,.2f}", body_style)],
            [Paragraph("Accommodation", body_style), Paragraph(f"{b.currency} {cats.accommodation:,.2f}", body_style)],
            [Paragraph("Food & Dining", body_style), Paragraph(f"{b.currency} {cats.food:,.2f}", body_style)],
            [Paragraph("Activities & Sights", body_style), Paragraph(f"{b.currency} {cats.activities:,.2f}", body_style)],
            [Paragraph("Miscellaneous", body_style), Paragraph(f"{b.currency} {cats.miscellaneous:,.2f}", body_style)],
            [Paragraph("<b>Total Estimated</b>", body_style), Paragraph(f"<b>{b.currency} {b.total_estimated:,.2f}</b>", body_style)],
        ]
        b_table = Table(budget_rows, colWidths=[260, 260])
        b_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
            ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#E2E8F0")),
            ("LINEABOVE", (0, -1), (-1, -1), 1, colors.HexColor("#94A3B8")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(b_table)

        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()


pdf_service = PDFService()
