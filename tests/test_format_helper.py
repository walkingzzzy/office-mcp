"""测试格式化辅助工具."""

import pytest

from office_mcp_server.utils.format_helper import (
    ColorUtils,
    FormatValidator,
    UnitConverter,
)


class TestColorUtils:
    """测试颜色工具类."""

    def test_hex_to_rgb(self) -> None:
        """测试 HEX 转 RGB."""
        assert ColorUtils.hex_to_rgb("#FF0000") == (255, 0, 0)
        assert ColorUtils.hex_to_rgb("00FF00") == (0, 255, 0)
        assert ColorUtils.hex_to_rgb("#0000FF") == (0, 0, 255)

    def test_hex_to_rgb_invalid(self) -> None:
        """测试无效 HEX 颜色."""
        with pytest.raises(ValueError):
            ColorUtils.hex_to_rgb("INVALID")

    def test_rgb_to_hex(self) -> None:
        """测试 RGB 转 HEX."""
        assert ColorUtils.rgb_to_hex(255, 0, 0) == "#FF0000"
        assert ColorUtils.rgb_to_hex(0, 255, 0) == "#00FF00"
        assert ColorUtils.rgb_to_hex(0, 0, 255) == "#0000FF"

    def test_rgb_to_hex_invalid(self) -> None:
        """测试无效 RGB 值."""
        with pytest.raises(ValueError):
            ColorUtils.rgb_to_hex(256, 0, 0)

    def test_validate_hex_color(self) -> None:
        """测试验证 HEX 颜色."""
        assert ColorUtils.validate_hex_color("#FF0000") is True
        assert ColorUtils.validate_hex_color("FF0000") is True
        assert ColorUtils.validate_hex_color("INVALID") is False


class TestUnitConverter:
    """测试单位转换工具类."""

    def test_cm_to_inches(self) -> None:
        """测试厘米转英寸."""
        assert round(UnitConverter.cm_to_inches(2.54), 2) == 1.0

    def test_inches_to_cm(self) -> None:
        """测试英寸转厘米."""
        assert round(UnitConverter.inches_to_cm(1.0), 2) == 2.54

    def test_pt_to_inches(self) -> None:
        """测试磅转英寸."""
        assert round(UnitConverter.pt_to_inches(72), 2) == 1.0

    def test_inches_to_pt(self) -> None:
        """测试英寸转磅."""
        assert round(UnitConverter.inches_to_pt(1.0), 2) == 72.0

    def test_emu_to_inches(self) -> None:
        """测试 EMU 转英寸."""
        assert round(UnitConverter.emu_to_inches(914400), 2) == 1.0

    def test_inches_to_emu(self) -> None:
        """测试英寸转 EMU."""
        assert UnitConverter.inches_to_emu(1.0) == 914400


class TestFormatValidator:
    """测试格式验证工具类."""

    def test_validate_font_size_valid(self) -> None:
        """测试验证有效字号."""
        assert FormatValidator.validate_font_size(12) is True
        assert FormatValidator.validate_font_size(14.5) is True

    def test_validate_font_size_invalid(self) -> None:
        """测试验证无效字号."""
        with pytest.raises(ValueError):
            FormatValidator.validate_font_size(0)
        with pytest.raises(ValueError):
            FormatValidator.validate_font_size(500)

    def test_validate_line_spacing_valid(self) -> None:
        """测试验证有效行距."""
        assert FormatValidator.validate_line_spacing(1.5) is True

    def test_validate_line_spacing_invalid(self) -> None:
        """测试验证无效行距."""
        with pytest.raises(ValueError):
            FormatValidator.validate_line_spacing(0)

    def test_validate_alignment_valid(self) -> None:
        """测试验证有效对齐方式."""
        assert FormatValidator.validate_alignment("left") is True
        assert FormatValidator.validate_alignment("center") is True

    def test_validate_alignment_invalid(self) -> None:
        """测试验证无效对齐方式."""
        with pytest.raises(ValueError):
            FormatValidator.validate_alignment("invalid")

    def test_validate_cell_reference_valid(self) -> None:
        """测试验证有效单元格引用."""
        assert FormatValidator.validate_cell_reference("A1") is True
        assert FormatValidator.validate_cell_reference("B10") is True

    def test_validate_cell_reference_invalid(self) -> None:
        """测试验证无效单元格引用."""
        with pytest.raises(ValueError):
            FormatValidator.validate_cell_reference("1A")

    def test_validate_range_reference_valid(self) -> None:
        """测试验证有效范围引用."""
        assert FormatValidator.validate_range_reference("A1:B10") is True

    def test_validate_range_reference_invalid(self) -> None:
        """测试验证无效范围引用."""
        with pytest.raises(ValueError):
            FormatValidator.validate_range_reference("A1-B10")
