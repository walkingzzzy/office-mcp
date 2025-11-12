"""文件管理工具模块.

提供文件读写、路径处理、文件验证等功能。
"""

import os
import shutil
from pathlib import Path
from typing import Optional, Union

from loguru import logger

from office_mcp_server.config import config


class FileManager:
    """文件管理器类."""

    @staticmethod
    def ensure_directory(directory: Union[str, Path]) -> Path:
        """确保目录存在,如果不存在则创建.

        Args:
            directory: 目录路径

        Returns:
            Path: 目录路径对象
        """
        dir_path = Path(directory)
        dir_path.mkdir(parents=True, exist_ok=True)
        logger.debug(f"确保目录存在: {dir_path}")
        return dir_path

    @staticmethod
    def validate_file_path(file_path: Union[str, Path], must_exist: bool = False) -> Path:
        """验证文件路径.

        Args:
            file_path: 文件路径
            must_exist: 是否必须存在

        Returns:
            Path: 文件路径对象

        Raises:
            FileNotFoundError: 当 must_exist=True 且文件不存在时
            ValueError: 当路径无效时
        """
        path = Path(file_path)

        # 检查路径是否有效
        if not path.name:
            raise ValueError(f"无效的文件路径: {file_path}")

        # 检查文件是否存在
        if must_exist and not path.exists():
            raise FileNotFoundError(f"文件不存在: {file_path}")

        logger.debug(f"验证文件路径: {path}")
        return path

    @staticmethod
    def validate_file_size(file_path: Union[str, Path], max_size: Optional[int] = None) -> bool:
        """验证文件大小.

        Args:
            file_path: 文件路径
            max_size: 最大文件大小(字节),默认使用配置值

        Returns:
            bool: 文件大小是否符合要求

        Raises:
            ValueError: 当文件超过最大大小时
        """
        path = Path(file_path)
        if not path.exists():
            return True  # 新文件默认通过

        max_size = max_size or config.server.max_file_size
        file_size = path.stat().st_size

        if file_size > max_size:
            raise ValueError(
                f"文件大小 {file_size} 字节超过最大限制 {max_size} 字节"
            )

        logger.debug(f"文件大小验证通过: {path} ({file_size} 字节)")
        return True

    @staticmethod
    def validate_file_extension(
        file_path: Union[str, Path], allowed_extensions: list[str]
    ) -> bool:
        """验证文件扩展名.

        Args:
            file_path: 文件路径
            allowed_extensions: 允许的扩展名列表(如 ['.docx', '.doc'])

        Returns:
            bool: 扩展名是否符合要求

        Raises:
            ValueError: 当文件扩展名不被允许时
        """
        path = Path(file_path)
        ext = path.suffix.lower()

        if ext not in [e.lower() for e in allowed_extensions]:
            raise ValueError(
                f"不支持的文件扩展名: {ext}, 允许的扩展名: {allowed_extensions}"
            )

        logger.debug(f"文件扩展名验证通过: {path}")
        return True

    @staticmethod
    def get_temp_file_path(prefix: str = "", suffix: str = "") -> Path:
        """获取临时文件路径.

        Args:
            prefix: 文件名前缀
            suffix: 文件扩展名

        Returns:
            Path: 临时文件路径
        """
        import uuid

        filename = f"{prefix}{uuid.uuid4()}{suffix}"
        temp_path = config.paths.temp_dir / filename
        logger.debug(f"生成临时文件路径: {temp_path}")
        return temp_path

    @staticmethod
    def copy_file(src: Union[str, Path], dst: Union[str, Path]) -> Path:
        """复制文件.

        Args:
            src: 源文件路径
            dst: 目标文件路径

        Returns:
            Path: 目标文件路径

        Raises:
            FileNotFoundError: 当源文件不存在时
        """
        src_path = Path(src)
        dst_path = Path(dst)

        if not src_path.exists():
            raise FileNotFoundError(f"源文件不存在: {src}")

        # 确保目标目录存在
        FileManager.ensure_directory(dst_path.parent)

        shutil.copy2(src_path, dst_path)
        logger.info(f"文件复制成功: {src} -> {dst}")
        return dst_path

    @staticmethod
    def move_file(src: Union[str, Path], dst: Union[str, Path]) -> Path:
        """移动文件.

        Args:
            src: 源文件路径
            dst: 目标文件路径

        Returns:
            Path: 目标文件路径

        Raises:
            FileNotFoundError: 当源文件不存在时
        """
        src_path = Path(src)
        dst_path = Path(dst)

        if not src_path.exists():
            raise FileNotFoundError(f"源文件不存在: {src}")

        # 确保目标目录存在
        FileManager.ensure_directory(dst_path.parent)

        shutil.move(str(src_path), str(dst_path))
        logger.info(f"文件移动成功: {src} -> {dst}")
        return dst_path

    @staticmethod
    def delete_file(file_path: Union[str, Path]) -> bool:
        """删除文件.

        Args:
            file_path: 文件路径

        Returns:
            bool: 是否删除成功
        """
        path = Path(file_path)

        if not path.exists():
            logger.warning(f"文件不存在,无需删除: {file_path}")
            return False

        path.unlink()
        logger.info(f"文件删除成功: {file_path}")
        return True

    @staticmethod
    def clean_temp_directory() -> int:
        """清理临时目录.

        Returns:
            int: 删除的文件数量
        """
        temp_dir = config.paths.temp_dir
        if not temp_dir.exists():
            return 0

        count = 0
        for file in temp_dir.glob("*"):
            if file.is_file():
                file.unlink()
                count += 1

        logger.info(f"临时目录清理完成,删除 {count} 个文件")
        return count
