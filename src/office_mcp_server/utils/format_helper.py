"""格式化辅助工具模块.

提供颜色转换、单位转换、格式验证等功能。
"""

import re
from typing import Optional, Tuple, Union

from loguru import logger


class ColorUtils:
    """颜色工具类."""

    @staticmethod
    def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
        """将 HEX 颜色转换为 RGB.

        Args:
            hex_color: HEX 颜色字符串 (如 '#FF0000' 或 'FF0000')

        Returns:
            Tuple[int, int, int]: RGB 值元组 (r, g, b)

        Raises:
            ValueError: 当 HEX 颜色格式无效时
        """
        # 移除 # 前缀
        hex_color = hex_color.lstrip("#")

        # 验证格式
        if not re.match(r"^[0-9A-Fa-f]{6}$", hex_color):
            raise ValueError(f"无效的 HEX 颜色格式: {hex_color}")

        r = int(hex_color[0:2], 16)
        g = int(hex_color[2:4], 16)
        b = int(hex_color[4:6], 16)

        logger.debug(f"HEX 转 RGB: #{hex_color} -> ({r}, {g}, {b})")
        return (r, g, b)

    @staticmethod
    def rgb_to_hex(r: int, g: int, b: int) -> str:
        """将 RGB 颜色转换为 HEX.

        Args:
            r: 红色值 (0-255)
            g: 绿色值 (0-255)
            b: 蓝色值 (0-255)

        Returns:
            str: HEX 颜色字符串 (如 '#FF0000')

        Raises:
            ValueError: 当 RGB 值超出范围时
        """
        # 验证范围
        for value, name in [(r, "R"), (g, "G"), (b, "B")]:
            if not 0 <= value <= 255:
                raise ValueError(f"{name} 值必须在 0-255 范围内,当前值: {value}")

        hex_color = f"#{r:02X}{g:02X}{b:02X}"
        logger.debug(f"RGB 转 HEX: ({r}, {g}, {b}) -> {hex_color}")
        return hex_color

    @staticmethod
    def validate_hex_color(hex_color: str) -> bool:
        """验证 HEX 颜色格式.

        Args:
            hex_color: HEX 颜色字符串

        Returns:
            bool: 是否为有效的 HEX 颜色
        """
        hex_color = hex_color.lstrip("#")
        return bool(re.match(r"^[0-9A-Fa-f]{6}$", hex_color))

    @staticmethod
    def validate_rgb_color(r: int, g: int, b: int) -> bool:
        """验证 RGB 颜色值.

        Args:
            r: 红色值
            g: 绿色值
            b: 蓝色值

        Returns:
            bool: 是否为有效的 RGB 颜色
        """
        return all(0 <= value <= 255 for value in [r, g, b])


class UnitConverter:
    """单位转换工具类."""

    # 英制单位转换常量
    INCH_TO_CM = 2.54
    INCH_TO_MM = 25.4
    INCH_TO_PT = 72
    INCH_TO_EMU = 914400  # EMU (English Metric Unit)

    @staticmethod
    def cm_to_inches(cm: float) -> float:
        """厘米转英寸.

        Args:
            cm: 厘米值

        Returns:
            float: 英寸值
        """
        return cm / UnitConverter.INCH_TO_CM

    @staticmethod
    def inches_to_cm(inches: float) -> float:
        """英寸转厘米.

        Args:
            inches: 英寸值

        Returns:
            float: 厘米值
        """
        return inches * UnitConverter.INCH_TO_CM

    @staticmethod
    def pt_to_inches(pt: float) -> float:
        """磅转英寸.

        Args:
            pt: 磅值

        Returns:
            float: 英寸值
        """
        return pt / UnitConverter.INCH_TO_PT

    @staticmethod
    def inches_to_pt(inches: float) -> float:
        """英寸转磅.

        Args:
            inches: 英寸值

        Returns:
            float: 磅值
        """
        return inches * UnitConverter.INCH_TO_PT

    @staticmethod
    def emu_to_inches(emu: int) -> float:
        """EMU 转英寸.

        Args:
            emu: EMU 值

        Returns:
            float: 英寸值
        """
        return emu / UnitConverter.INCH_TO_EMU

    @staticmethod
    def inches_to_emu(inches: float) -> int:
        """英寸转 EMU.

        Args:
            inches: 英寸值

        Returns:
            int: EMU 值
        """
        return int(inches * UnitConverter.INCH_TO_EMU)

    @staticmethod
    def cm_to_emu(cm: float) -> int:
        """厘米转 EMU.

        Args:
            cm: 厘米值

        Returns:
            int: EMU 值
        """
        inches = UnitConverter.cm_to_inches(cm)
        return UnitConverter.inches_to_emu(inches)

    @staticmethod
    def emu_to_cm(emu: int) -> float:
        """EMU 转厘米.

        Args:
            emu: EMU 值

        Returns:
            float: 厘米值
        """
        inches = UnitConverter.emu_to_inches(emu)
        return UnitConverter.inches_to_cm(inches)


class FormatValidator:
    """格式验证工具类."""

    @staticmethod
    def validate_font_size(size: Union[int, float]) -> bool:
        """验证字号大小.

        Args:
            size: 字号大小

        Returns:
            bool: 是否有效

        Raises:
            ValueError: 当字号无效时
        """
        if not isinstance(size, (int, float)) or size <= 0 or size > 409:
            raise ValueError(f"无效的字号: {size}, 字号必须在 1-409 之间")
        return True

    @staticmethod
    def validate_line_spacing(spacing: Union[int, float]) -> bool:
        """验证行距.

        Args:
            spacing: 行距值

        Returns:
            bool: 是否有效

        Raises:
            ValueError: 当行距无效时
        """
        if not isinstance(spacing, (int, float)) or spacing <= 0:
            raise ValueError(f"无效的行距: {spacing}, 行距必须大于 0")
        return True

    @staticmethod
    def validate_alignment(alignment: str) -> bool:
        """验证对齐方式.

        Args:
            alignment: 对齐方式 ('left', 'center', 'right', 'justify')

        Returns:
            bool: 是否有效

        Raises:
            ValueError: 当对齐方式无效时
        """
        valid_alignments = ["left", "center", "right", "justify"]
        if alignment.lower() not in valid_alignments:
            raise ValueError(
                f"无效的对齐方式: {alignment}, 有效值: {valid_alignments}"
            )
        return True

    @staticmethod
    def validate_cell_reference(cell_ref: str) -> bool:
        """验证 Excel 单元格引用.

        Args:
            cell_ref: 单元格引用 (如 'A1', 'B10')

        Returns:
            bool: 是否有效

        Raises:
            ValueError: 当单元格引用无效时
        """
        if not re.match(r"^[A-Z]+\d+$", cell_ref.upper()):
            raise ValueError(f"无效的单元格引用: {cell_ref}")
        return True

    @staticmethod
    def validate_range_reference(range_ref: str) -> bool:
        """验证 Excel 范围引用.

        Args:
            range_ref: 范围引用 (如 'A1:B10')

        Returns:
            bool: 是否有效

        Raises:
            ValueError: 当范围引用无效时
        """
        if not re.match(r"^[A-Z]+\d+:[A-Z]+\d+$", range_ref.upper()):
            raise ValueError(f"无效的范围引用: {range_ref}")
        return True
