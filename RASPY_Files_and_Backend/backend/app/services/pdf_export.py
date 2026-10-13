from fpdf import FPDF
from typing import List, Dict, Any, Optional
from datetime import datetime
import io


class SystemLogsPDF(FPDF):
    def __init__(self, filters: Dict[str, Any] = None):
        super().__init__(orientation='L', unit='mm', format='A4')
        self.filters = filters or {}
        self.set_auto_page_break(auto=True, margin=20)

    def header(self):
        # Title
        self.set_font('Helvetica', 'B', 16)
        self.cell(0, 10, 'Vision-Trak System Logs Report', 0, 1, 'C')
        
        # Subtitle with generation date
        self.set_font('Helvetica', '', 9)
        self.cell(0, 5, f'Generated on: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', 0, 1, 'C')
        
        # Filters applied
        if self.filters:
            self.set_font('Helvetica', 'I', 8)
            filter_parts = []
            if self.filters.get('search'):
                filter_parts.append(f"Search: {self.filters['search']}")
            if self.filters.get('date_from'):
                filter_parts.append(f"From: {self.filters['date_from']}")
            if self.filters.get('date_to'):
                filter_parts.append(f"To: {self.filters['date_to']}")
            if self.filters.get('action_type'):
                filter_parts.append(f"Action: {self.filters['action_type']}")
            if self.filters.get('role'):
                filter_parts.append(f"Role: {self.filters['role']}")
            if filter_parts:
                self.cell(0, 5, 'Filters: ' + ' | '.join(filter_parts), 0, 1, 'C')
        
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}}', 0, 0, 'C')

    def add_table(self, logs: List[Dict]):
        # Column widths for landscape A4 (277mm usable)
        col_widths = {
            'log_id': 15,
            'username': 30,
            'role': 30,
            'action_type': 30,
            'target_table': 25,
            'description': 70,
            'ip_address': 30,
            'timestamp': 35,
        }
        
        # Headers
        headers = {
            'log_id': 'ID',
            'username': 'User',
            'role': 'Role',
            'action_type': 'Action',
            'target_table': 'Table',
            'description': 'Description',
            'ip_address': 'IP Address',
            'timestamp': 'Date/Time',
        }
        
        # Header row
        self.set_font('Helvetica', 'B', 7)
        self.set_fill_color(52, 73, 94)  # Dark blue
        self.set_text_color(255, 255, 255)
        
        for key, width in col_widths.items():
            self.cell(width, 7, headers[key], 1, 0, 'C', True)
        self.ln()
        
        # Data rows
        self.set_font('Helvetica', '', 6.5)
        self.set_text_color(0, 0, 0)
        
        fill = False
        for log in logs:
            if self.get_y() > 180:  # Near bottom, add new page
                self.add_page()
                # Re-draw headers on new page
                self.set_font('Helvetica', 'B', 7)
                self.set_fill_color(52, 73, 94)
                self.set_text_color(255, 255, 255)
                for key, width in col_widths.items():
                    self.cell(width, 7, headers[key], 1, 0, 'C', True)
                self.ln()
                self.set_font('Helvetica', '', 6.5)
                self.set_text_color(0, 0, 0)
            
            if fill:
                self.set_fill_color(240, 245, 250)
            else:
                self.set_fill_color(255, 255, 255)
            
            # Prepare cell values
            values = {
                'log_id': str(log.get('log_id', '')),
                'username': str(log.get('username', '—'))[:20],
                'role': str(log.get('role', '—'))[:15],
                'action_type': str(log.get('action_type', '—'))[:15],
                'target_table': str(log.get('target_table', '—'))[:12],
                'description': str(log.get('description', '—'))[:40],
                'ip_address': str(log.get('ip_address', '—'))[:15],
                'timestamp': log.get('timestamp', '—')[:19] if log.get('timestamp') else '—',
            }
            
            # Calculate row height based on description length
            row_height = 6
            
            x_start = self.get_x()
            y_start = self.get_y()
            
            for key, width in col_widths.items():
                x = self.get_x()
                y = self.get_y()
                self.rect(x, y, width, 6, 'D')
                self.set_xy(x + 1, y + 1)
                self.multi_cell(width - 2, 3, str(values[key]), 0, 'L')
            
            self.set_y(y_start + row_height)
            fill = not fill


def generate_system_logs_pdf(logs: List[Dict], filters: Dict = None) -> bytes:
    """Generate PDF report for system logs."""
    pdf = SystemLogsPDF(filters=filters)
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.add_table(logs)
    
    # Output to bytes
    pdf_output = pdf.output(dest='S')
    if isinstance(pdf_output, str):
        return pdf_output.encode('latin-1')
    if isinstance(pdf_output, bytearray):
        return bytes(pdf_output)
    return pdf_output