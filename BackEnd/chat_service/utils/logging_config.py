import logging
from logging.handlers import TimedRotatingFileHandler
import os

def setup_logger(name: str, level=logging.INFO, log_dir: str = "logs"):
    os.makedirs(log_dir, exist_ok=True)
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger
    
    # Trình ghi log ra màn hình
    ch = logging.StreamHandler()
    ch.setLevel(level)
    fmt = logging.Formatter("[%(asctime)s] %(levelname)s %(name)s: %(message)s")
    ch.setFormatter(fmt)
    logger.addHandler(ch)

    # Bộ xử lý luân phiên tệp(hằng ngày)
    fh = TimedRotatingFileHandler(os.path.join(log_dir, f"{name}.log"), when="midnight", backupCount=7, encoding="utf-8")
    fh.setLevel(level)
    fh.setFormatter(fmt)
    logger.addHandler(fh)

    logger.setLevel(level)
    return logger