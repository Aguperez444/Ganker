import io
import pytest
from app.infrastructure.storage.local_disk_storage_service import LocalDiskStorageService


class TestLocalDiskStorageService:

    @pytest.fixture
    def storage(self, tmp_path):
        return LocalDiskStorageService(base_dir=tmp_path, base_url="/media")

    def test_save_image_file_uuid_default(self, storage, tmp_path):
        file_bytes = b"sample image binary content"
        stream = io.BytesIO(file_bytes)

        url = storage.save_image_file(
            file_content=stream,
            filename="my_photo.jpg",
            subfolder="users/icons",
            preserve_original_name=False
        )

        assert url.startswith("/media/users/icons/")
        assert url.endswith(".jpg")

        relative_path = url.removeprefix("/media/").lstrip("/")
        saved_file = tmp_path / relative_path
        assert saved_file.exists()
        assert saved_file.read_bytes() == file_bytes

    def test_save_image_file_preserve_original_name_and_avoid_collision(self, storage, tmp_path):
        stream1 = io.BytesIO(b"first version")
        url1 = storage.save_image_file(
            file_content=stream1,
            filename="logo.png",
            subfolder="games/lol",
            preserve_original_name=True
        )
        assert url1 == "/media/games/lol/logo.png"

        # Second upload with same name should append _1 suffix
        stream2 = io.BytesIO(b"second version")
        url2 = storage.save_image_file(
            file_content=stream2,
            filename="logo.png",
            subfolder="games/lol",
            preserve_original_name=True
        )
        assert url2 == "/media/games/lol/logo_1.png"

        # Third upload should append _2 suffix
        stream3 = io.BytesIO(b"third version")
        url3 = storage.save_image_file(
            file_content=stream3,
            filename="logo.png",
            subfolder="games/lol",
            preserve_original_name=True
        )
        assert url3 == "/media/games/lol/logo_2.png"

    def test_delete_file_success(self, storage, tmp_path):
        stream = io.BytesIO(b"to be deleted")
        url = storage.save_image_file(
            file_content=stream,
            filename="temp.png",
            subfolder="temp",
            preserve_original_name=True
        )

        relative_path = url.removeprefix("/media/").lstrip("/")
        file_on_disk = tmp_path / relative_path
        assert file_on_disk.exists()

        result = storage.delete_file(url)
        assert result is True
        assert not file_on_disk.exists()

    def test_delete_file_non_existent(self, storage):
        result = storage.delete_file("/media/temp/does_not_exist.png")
        assert result is False
