import sqlite3
import pandas as pd
from datetime import datetime


def create_db(history_data, filename):
    """将历史记录数据保存到SQLite数据库"""
    try:
        # 将数据转换为DataFrame
        df = pd.DataFrame(history_data)

        # 添加时间戳列
        df['export_time'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # 创建数据库连接
        conn = sqlite3.connect(filename)

        # 将数据写入数据库
        df.to_sql('history', conn, if_exists='replace', index=False)

        # 创建索引
        with conn:
            conn.execute('CREATE INDEX IF NOT EXISTS idx_url ON history(url)')
            conn.execute(
                'CREATE INDEX IF NOT EXISTS idx_time ON history(lastVisitTime)')

        return True
    except Exception as e:
        print(f"数据库创建失败: {e}")
        return False
    finally:
        if conn:
            conn.close()


def read_db(filename):
    """从SQLite数据库读取历史记录"""
    try:
        conn = sqlite3.connect(filename)
        df = pd.read_sql('SELECT * FROM history', conn)
        return df.to_dict('records')
    except Exception as e:
        print(f"数据库读取失败: {e}")
        return None
    finally:
        if conn:
            conn.close()
