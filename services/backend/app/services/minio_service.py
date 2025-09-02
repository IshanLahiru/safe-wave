import os
import uuid
from typing import Optional, BinaryIO
from minio import Minio
from minio.error import S3Error
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class MinIOService:
    """Service for handling MinIO file operations"""
    
    def __init__(self):
        try:
            self.client = Minio(
                settings.MINIO_ENDPOINT,
                access_key=settings.MINIO_ACCESS_KEY,
                secret_key=settings.MINIO_SECRET_KEY,
                secure=settings.MINIO_SECURE
            )
            self.bucket_name = settings.MINIO_BUCKET_NAME
            self._ensure_bucket_exists()
            self.minio_available = True
        except Exception as e:
            logger.warning(f"MinIO initialization failed: {e}. Using local storage fallback.")
            self.minio_available = False
            self.client = None
    
    def _ensure_bucket_exists(self):
        """Ensure the audio bucket exists"""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"Created bucket: {self.bucket_name}")
                
                # Set bucket policy for public read access to audio files
                policy = {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"AWS": "*"},
                            "Action": ["s3:GetObject"],
                            "Resource": [f"arn:aws:s3:::{self.bucket_name}/*"]
                        }
                    ]
                }
                
                self.client.set_bucket_policy(self.bucket_name, policy)
                logger.info(f"Set public read policy for bucket: {self.bucket_name}")
                
        except S3Error as e:
            logger.error(f"Error ensuring bucket exists: {e}")
            raise
    
    def upload_audio_file(self, file_data: BinaryIO, filename: str, content_type: str = "audio/wav") -> str:
        """
        Upload audio file to MinIO or fallback to local storage
        
        Args:
            file_data: File data to upload
            filename: Original filename
            content_type: MIME type of the file
            
        Returns:
            str: Object key or local file path
        """
        if not self.minio_available:
            # Fallback to local storage
            import os
            os.makedirs("uploads/audio", exist_ok=True)
            local_path = f"uploads/audio/{uuid.uuid4()}_{filename}"
            
            # Copy file data to local storage
            with open(local_path, 'wb') as f:
                file_data.seek(0)
                f.write(file_data.read())
            
            logger.info(f"File saved to local storage: {local_path}")
            return local_path
        
        try:
            # Generate unique object key
            file_extension = os.path.splitext(filename)[1]
            object_key = f"audio/{uuid.uuid4()}_{filename}"
            
            # Upload file
            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=object_key,
                data=file_data,
                length=-1,  # Let MinIO determine length
                content_type=content_type
            )
            
            logger.info(f"Successfully uploaded file: {object_key}")
            return object_key
            
        except S3Error as e:
            logger.error(f"Error uploading file to MinIO: {e}")
            # Fallback to local storage
            import os
            os.makedirs("uploads/audio", exist_ok=True)
            local_path = f"uploads/audio/{uuid.uuid4()}_{filename}"
            
            # Copy file data to local storage
            with open(local_path, 'wb') as f:
                file_data.seek(0)
                f.write(file_data.read())
            
            logger.info(f"Fallback to local storage: {local_path}")
            return local_path
    
    def get_file_url(self, object_key: str, expires: int = 3600) -> str:
        """
        Get presigned URL for file access
        
        Args:
            object_key: Object key in MinIO
            expires: URL expiration time in seconds
            
        Returns:
            str: Presigned URL
        """
        try:
            url = self.client.presigned_get_object(
                bucket_name=self.bucket_name,
                object_name=object_key,
                expires=expires
            )
            return url
        except S3Error as e:
            logger.error(f"Error generating presigned URL: {e}")
            raise
    
    def get_public_url(self, object_key: str) -> str:
        """
        Get public URL for file access (if bucket policy allows)
        
        Args:
            object_key: Object key in MinIO
            
        Returns:
            str: Public URL
        """
        return f"http://{settings.MINIO_ENDPOINT}/{self.bucket_name}/{object_key}"
    
    def delete_file(self, object_key: str) -> bool:
        """
        Delete file from MinIO
        
        Args:
            object_key: Object key in MinIO
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            self.client.remove_object(self.bucket_name, object_key)
            logger.info(f"Successfully deleted file: {object_key}")
            return True
        except S3Error as e:
            logger.error(f"Error deleting file from MinIO: {e}")
            return False
    
    def file_exists(self, object_key: str) -> bool:
        """
        Check if file exists in MinIO
        
        Args:
            object_key: Object key in MinIO
            
        Returns:
            bool: True if file exists, False otherwise
        """
        try:
            self.client.stat_object(self.bucket_name, object_key)
            return True
        except S3Error:
            return False
    
    def get_file_info(self, object_key: str) -> Optional[dict]:
        """
        Get file information from MinIO
        
        Args:
            object_key: Object key in MinIO
            
        Returns:
            dict: File information or None if not found
        """
        try:
            stat = self.client.stat_object(self.bucket_name, object_key)
            return {
                "size": stat.size,
                "last_modified": stat.last_modified,
                "etag": stat.etag,
                "content_type": stat.content_type
            }
        except S3Error as e:
            logger.error(f"Error getting file info: {e}")
            return None
    
    def list_files(self, prefix: str = "audio/", recursive: bool = True) -> list:
        """
        List files in MinIO bucket
        
        Args:
            prefix: Prefix to filter objects
            recursive: Whether to list recursively
            
        Returns:
            list: List of object keys
        """
        try:
            objects = self.client.list_objects(
                bucket_name=self.bucket_name,
                prefix=prefix,
                recursive=recursive
            )
            return [obj.object_name for obj in objects]
        except S3Error as e:
            logger.error(f"Error listing files: {e}")
            return []
    
    def copy_file(self, source_key: str, dest_key: str) -> bool:
        """
        Copy file within MinIO bucket
        
        Args:
            source_key: Source object key
            dest_key: Destination object key
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            self.client.copy_object(
                bucket_name=self.bucket_name,
                source=f"{self.bucket_name}/{source_key}",
                object_name=dest_key
            )
            logger.info(f"Successfully copied file from {source_key} to {dest_key}")
            return True
        except S3Error as e:
            logger.error(f"Error copying file: {e}")
            return False

# Global MinIO service instance
minio_service = MinIOService()
