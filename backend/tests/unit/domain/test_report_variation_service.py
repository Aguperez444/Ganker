from app.domain.services.report_variation_service import (
    TREND_DOWN,
    TREND_STABLE,
    TREND_UP,
    ReportVariationService,
)


class TestReportVariationService:

    def test_upward_variation(self):
        assert ReportVariationService.compute(current_count=3, previous_count=2) == (1, 50.0, TREND_UP)

    def test_downward_variation(self):
        assert ReportVariationService.compute(current_count=1, previous_count=4) == (-3, -75.0, TREND_DOWN)

    def test_stable_variation(self):
        assert ReportVariationService.compute(current_count=5, previous_count=5) == (0, 0.0, TREND_STABLE)

    def test_without_previous_value_percentage_is_none(self):
        assert ReportVariationService.compute(current_count=4, previous_count=0) == (4, None, TREND_UP)

    def test_percentage_is_rounded_to_two_decimals(self):
        _, percentage, _ = ReportVariationService.compute(current_count=1, previous_count=3)
        assert percentage == -66.67

    def test_resolve_trend_boundaries(self):
        assert ReportVariationService.resolve_trend(1) == TREND_UP
        assert ReportVariationService.resolve_trend(-1) == TREND_DOWN
        assert ReportVariationService.resolve_trend(0) == TREND_STABLE
