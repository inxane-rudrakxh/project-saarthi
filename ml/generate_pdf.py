import os
from fpdf import FPDF
from datetime import datetime

class ProjectRiskPDF(FPDF):
    def header(self):
        self.set_font('Helvetica', 'B', 15)
        self.cell(0, 10, 'Project Risk Assessment Report', border=False, align='C')
        self.ln(20)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}/{{nb}} - Generated on {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', 0, 0, 'C')

def create_pdf_report(result: dict, output_path: str = 'output/project_risk_report.pdf'):
    pdf = ProjectRiskPDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    
    # Define colors based on risk level
    risk_level = result.get('riskLevel', 'UNKNOWN')
    risk_score = result.get('riskScore', 0)
    
    if risk_level == 'CRITICAL':
        risk_color = (200, 0, 0)
    elif risk_level == 'HIGH':
        risk_color = (255, 140, 0)
    elif risk_level == 'MEDIUM':
        risk_color = (200, 200, 0)
    else:
        risk_color = (0, 150, 0)
        
    # Overview Section
    pdf.set_font('Helvetica', 'B', 14)
    pdf.cell(0, 10, 'Overview', ln=True)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(5)
    
    pdf.set_font('Helvetica', '', 12)
    pdf.cell(50, 10, 'Risk Score: ', ln=False)
    pdf.set_font('Helvetica', 'B', 12)
    pdf.set_text_color(*risk_color)
    pdf.cell(0, 10, f'{risk_score:.2f} / 100', ln=True)
    pdf.set_text_color(0, 0, 0)
    
    pdf.set_font('Helvetica', '', 12)
    pdf.cell(50, 10, 'Risk Level: ', ln=False)
    pdf.set_font('Helvetica', 'B', 12)
    pdf.set_text_color(*risk_color)
    pdf.cell(0, 10, risk_level, ln=True)
    pdf.set_text_color(0, 0, 0)
    pdf.ln(10)
    
    # SHAP Explanations Section
    pdf.set_font('Helvetica', 'B', 14)
    pdf.cell(0, 10, 'Key Risk Drivers (SHAP Explanation)', ln=True)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(5)
    
    pdf.set_font('Helvetica', 'B', 12)
    pdf.cell(80, 10, 'Feature', border=1)
    pdf.cell(30, 10, 'Value', border=1, align='C')
    pdf.cell(40, 10, 'Impact', border=1, align='C')
    pdf.cell(40, 10, 'Direction', border=1, align='C')
    pdf.ln(10)
    
    pdf.set_font('Helvetica', '', 11)
    for factor in result.get('shapFactors', []):
        pdf.cell(80, 10, str(factor['feature']), border=1)
        pdf.cell(30, 10, str(factor['value']), border=1, align='C')
        pdf.cell(40, 10, f"{factor['contribution']:.4f}", border=1, align='C')
        
        direction = factor['direction']
        if direction == 'risk_up':
            pdf.set_text_color(200, 0, 0)
            dir_text = 'INCREASES RISK'
        else:
            pdf.set_text_color(0, 150, 0)
            dir_text = 'DECREASES RISK'
            
        pdf.cell(40, 10, dir_text, border=1, align='C')
        pdf.set_text_color(0, 0, 0)
        pdf.ln(10)
        
    pdf.ln(10)
    pdf.set_font('Helvetica', 'I', 10)
    pdf.multi_cell(0, 5, 'Note: This report is automatically generated based on the Machine Learning model predictions. SHAP values illustrate the contribution of individual features toward the final risk score compared to the average project.')

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    pdf.output(output_path)
    return output_path
