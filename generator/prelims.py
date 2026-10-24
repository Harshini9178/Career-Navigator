import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

from styles import (
    set_cell_background, set_cell_margins, set_table_borders,
    add_page_number_field
)

def add_cover_page(doc):
    # Top VTU Header
    p_univ = doc.add_paragraph()
    p_univ.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_univ.paragraph_format.space_before = Pt(0)
    p_univ.paragraph_format.space_after = Pt(1)
    p_univ.paragraph_format.line_spacing = 1.05
    r_u1 = p_univ.add_run("VISVESVARAYA TECHNOLOGICAL UNIVERSITY\n")
    r_u1.font.name = 'Times New Roman'
    r_u1.font.size = Pt(13)
    r_u1.font.bold = True
    r_u1.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    
    r_u2 = p_univ.add_run("“Jnana Sangama”, Belagavi-590018, Karnataka\n")
    r_u2.font.name = 'Times New Roman'
    r_u2.font.size = Pt(10)
    r_u2.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
    
    # VTU Logo
    vtu_logo = 'extracted_assets/img_p1_2__IM21.jpg'
    if os.path.exists(vtu_logo):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(2)
        p_logo.paragraph_format.space_after = Pt(4)
        run_logo = p_logo.add_run()
        run_logo.add_picture(vtu_logo, width=Inches(0.85))

    # Project Report Text
    p_rep = doc.add_paragraph()
    p_rep.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_rep.paragraph_format.space_before = Pt(2)
    p_rep.paragraph_format.space_after = Pt(1)
    p_rep.paragraph_format.line_spacing = 1.05
    r_rep1 = p_rep.add_run("A PROJECT REPORT (BCS786)\n")
    r_rep1.font.name = 'Times New Roman'
    r_rep1.font.size = Pt(12)
    r_rep1.font.bold = True
    r_rep1.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    
    r_rep2 = p_rep.add_run("on\n")
    r_rep2.font.name = 'Times New Roman'
    r_rep2.font.size = Pt(10)
    
    # Project Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(2)
    p_title.paragraph_format.space_after = Pt(4)
    p_title.paragraph_format.line_spacing = 1.15
    r_title = p_title.add_run("“CAREER NAVIGATOR: ENTERPRISE-GRADE AI-POWERED CAREER AND PLACEMENT READINESS PLATFORM”\n")
    r_title.font.name = 'Times New Roman'
    r_title.font.size = Pt(13)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    # Fulfillment statement
    p_ful = doc.add_paragraph()
    p_ful.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_ful.paragraph_format.space_before = Pt(2)
    p_ful.paragraph_format.space_after = Pt(4)
    p_ful.paragraph_format.line_spacing = 1.1
    r_ful = p_ful.add_run("Submitted in partial fulfillment of the requirements for the award of the degree of\nBachelor of Engineering\nin\nComputer Science & Engineering\n")
    r_ful.font.name = 'Times New Roman'
    r_ful.font.size = Pt(10)
    r_ful.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    # Submitted by header
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(2)
    p_sub.paragraph_format.space_after = Pt(2)
    r_sub = p_sub.add_run("Submitted by\n")
    r_sub.font.name = 'Times New Roman'
    r_sub.font.size = Pt(10.5)
    r_sub.font.bold = True

    # Student Table
    tbl_students = doc.add_table(rows=5, cols=2)
    tbl_students.alignment = WD_TABLE_ALIGNMENT.CENTER
    tblBorders = parse_xml(f'<w:tblBorders {nsdecls("w")}><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders>')
    tbl_students._tbl.tblPr.append(tblBorders)
    
    col_w = [Inches(1.8), Inches(2.5)]
    headers = [("USN", "Name"),
               ("1KI21CS001", "HARSHINI P"),
               ("1KI21CS002", "ANANYA S"),
               ("1KI21CS003", "KIRAN KUMAR R"),
               ("1KI21CS004", "DARSHAN M")]
    
    for r_idx, (u, n) in enumerate(headers):
        for c_idx, val in enumerate([u, n]):
            cell = tbl_students.cell(r_idx, c_idx)
            cell.width = col_w[c_idx]
            set_cell_margins(cell, top=20, bottom=20, left=40, right=40)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.0
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(9.5)
            if r_idx == 0:
                r.font.bold = True
                r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

    # Guidance Section
    p_guid = doc.add_paragraph()
    p_guid.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_guid.paragraph_format.space_before = Pt(4)
    p_guid.paragraph_format.space_after = Pt(2)
    p_guid.paragraph_format.line_spacing = 1.05
    r_g1 = p_guid.add_run("Under the Guidance of\n")
    r_g1.font.name = 'Times New Roman'
    r_g1.font.size = Pt(10)
    r_g1.font.italic = True
    
    r_g2 = p_guid.add_run("Prof. Guide Name\n")
    r_g2.font.name = 'Times New Roman'
    r_g2.font.size = Pt(10.5)
    r_g2.font.bold = True
    
    r_g3 = p_guid.add_run("Assistant Professor\nDepartment of CS&E, KIT, Tiptur-572201\n")
    r_g3.font.name = 'Times New Roman'
    r_g3.font.size = Pt(9.5)
    r_g3.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    # KIT Logo
    kit_logo = 'extracted_assets/img_p1_1__IM20.jpg'
    if os.path.exists(kit_logo):
        p_logo2 = doc.add_paragraph()
        p_logo2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo2.paragraph_format.space_before = Pt(2)
        p_logo2.paragraph_format.space_after = Pt(3)
        run_logo2 = p_logo2.add_run()
        run_logo2.add_picture(kit_logo, width=Inches(0.75))

    # College Footer
    p_col = doc.add_paragraph()
    p_col.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_col.paragraph_format.space_before = Pt(1)
    p_col.paragraph_format.space_after = Pt(0)
    p_col.paragraph_format.line_spacing = 1.05
    r_c1 = p_col.add_run("DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING\n")
    r_c1.font.name = 'Times New Roman'
    r_c1.font.size = Pt(11)
    r_c1.font.bold = True
    r_c1.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    
    r_c2 = p_col.add_run("KALPATARU INSTITUTE OF TECHNOLOGY\n")
    r_c2.font.name = 'Times New Roman'
    r_c2.font.size = Pt(12)
    r_c2.font.bold = True
    r_c2.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    
    r_c3 = p_col.add_run("NBA Accredited 2025-28 & NAAC Accredited\nN H-206, Tiptur-572201\n2026-2027")
    r_c3.font.name = 'Times New Roman'
    r_c3.font.size = Pt(9.0)
    r_c3.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    doc.add_page_break()

def add_certificate_page(doc):
    p_hdr = doc.add_paragraph()
    p_hdr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_hdr.paragraph_format.space_before = Pt(0)
    p_hdr.paragraph_format.space_after = Pt(2)
    p_hdr.paragraph_format.line_spacing = 1.15
    r_h1 = p_hdr.add_run("KALPATARU INSTITUTE OF TECHNOLOGY\n")
    r_h1.font.name = 'Times New Roman'
    r_h1.font.size = Pt(14)
    r_h1.font.bold = True
    r_h1.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    
    r_h2 = p_hdr.add_run("NH-206, Tiptur-572201\n")
    r_h2.font.name = 'Times New Roman'
    r_h2.font.size = Pt(11)
    
    r_h3 = p_hdr.add_run("DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING\n")
    r_h3.font.name = 'Times New Roman'
    r_h3.font.size = Pt(12)
    r_h3.font.bold = True
    r_h3.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    
    r_h4 = p_hdr.add_run("NBA Accredited 2025-28 & NAAC Accredited\n")
    r_h4.font.name = 'Times New Roman'
    r_h4.font.size = Pt(9.5)
    r_h4.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    kit_logo = 'extracted_assets/img_p1_1__IM20.jpg'
    if os.path.exists(kit_logo):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(3)
        p_logo.paragraph_format.space_after = Pt(6)
        run_logo = p_logo.add_run()
        run_logo.add_picture(kit_logo, width=Inches(0.85))

    p_cert = doc.add_paragraph()
    p_cert.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cert.paragraph_format.space_before = Pt(4)
    p_cert.paragraph_format.space_after = Pt(10)
    r_cert = p_cert.add_run("Certificate")
    r_cert.font.name = 'Times New Roman'
    r_cert.font.size = Pt(18)
    r_cert.font.bold = True
    r_cert.font.italic = True
    r_cert.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    p_body = doc.add_paragraph()
    p_body.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_body.paragraph_format.line_spacing = 1.3
    p_body.paragraph_format.space_after = Pt(6)
    r_b = p_body.add_run("This is to certify that the project work entitled “CAREER NAVIGATOR: ENTERPRISE-GRADE AI-POWERED CAREER AND PLACEMENT READINESS PLATFORM” carried out by:")
    r_b.font.name = 'Times New Roman'
    r_b.font.size = Pt(11)

    # Student Table
    tbl_students = doc.add_table(rows=5, cols=2)
    tbl_students.alignment = WD_TABLE_ALIGNMENT.CENTER
    tblBorders = parse_xml(f'<w:tblBorders {nsdecls("w")}><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders>')
    tbl_students._tbl.tblPr.append(tblBorders)
    
    col_w = [Inches(2.0), Inches(2.8)]
    headers = [("USN", "Name"),
               ("1KI21CS001", "HARSHINI P"),
               ("1KI21CS002", "ANANYA S"),
               ("1KI21CS003", "KIRAN KUMAR R"),
               ("1KI21CS004", "DARSHAN M")]
    
    for r_idx, (u, n) in enumerate(headers):
        for c_idx, val in enumerate([u, n]):
            cell = tbl_students.cell(r_idx, c_idx)
            cell.width = col_w[c_idx]
            set_cell_margins(cell, top=20, bottom=20, left=40, right=40)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.0
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10)
            if r_idx == 0:
                r.font.bold = True
                r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

    p_body2 = doc.add_paragraph()
    p_body2.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_body2.paragraph_format.line_spacing = 1.3
    p_body2.paragraph_format.space_before = Pt(6)
    p_body2.paragraph_format.space_after = Pt(14)
    r_b2 = p_body2.add_run(
        "Bonafide students of VII semester B.E. for the partial fulfillment of the requirements for the award of "
        "Bachelor of Engineering Degree in Computer Science & Engineering of the VISVESVARAYA TECHNOLOGICAL UNIVERSITY "
        "during the academic year 2026-27. It is certified that all corrections/suggestions indicated for Internal Assessment "
        "have been incorporated in the report. The project report has been approved as it satisfies the academic requirements "
        "in respect of Project work prescribed for the said degree."
    )
    r_b2.font.name = 'Times New Roman'
    r_b2.font.size = Pt(11)

    # Signatures Table (Guide, HOD, Principal)
    tbl_sig = doc.add_table(rows=1, cols=3)
    tbl_sig.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_sig._tbl.tblPr.append(tblBorders)
    sig_w = [Inches(2.0), Inches(2.0), Inches(2.0)]
    
    sigs = [
        ("Signature of Guide\n\n\n\nProf. Guide Name\nDesignation\nDept. of CSE",
         "Signature of HOD\n\n\n\nDr. Maithri C\nProf. & Head\nDept. of CSE",
         "Signature of Principal\n\n\n\nDr. Sateesh Kumar H C\nPrincipal\nKIT, Tiptur")
    ]
    for c_idx, text in enumerate(sigs[0]):
        cell = tbl_sig.cell(0, c_idx)
        cell.width = sig_w[c_idx]
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_after = Pt(0)
        lines = text.split('\n\n\n\n')
        r_top = p.add_run(lines[0] + "\n\n\n\n")
        r_top.font.name = 'Times New Roman'
        r_top.font.size = Pt(10)
        r_top.font.bold = True
        r_bot = p.add_run(lines[1])
        r_bot.font.name = 'Times New Roman'
        r_bot.font.size = Pt(9.5)
        r_bot.font.bold = True

    # External Viva Table
    p_viva = doc.add_paragraph()
    p_viva.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_viva.paragraph_format.space_before = Pt(14)
    p_viva.paragraph_format.space_after = Pt(3)
    r_v = p_viva.add_run("External Viva")
    r_v.font.name = 'Times New Roman'
    r_v.font.size = Pt(11)
    r_v.font.bold = True

    tbl_viva = doc.add_table(rows=3, cols=2)
    tbl_viva.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_viva._tbl.tblPr.append(tblBorders)
    viva_w = [Inches(3.2), Inches(2.8)]
    
    viva_data = [
        ("Name of the Examiners", "Signature with date"),
        ("1. ", "1. "),
        ("2. ", "2. ")
    ]
    for r_idx, (e, s) in enumerate(viva_data):
        for c_idx, val in enumerate([e, s]):
            cell = tbl_viva.cell(r_idx, c_idx)
            cell.width = viva_w[c_idx]
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.15
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10)
            if r_idx == 0:
                r.font.bold = True

    doc.add_page_break()

def add_declaration_page(doc):
    p_hdr = doc.add_paragraph()
    p_hdr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_hdr.paragraph_format.space_before = Pt(0)
    p_hdr.paragraph_format.space_after = Pt(2)
    p_hdr.paragraph_format.line_spacing = 1.15
    r_h1 = p_hdr.add_run("KALPATARU INSTITUTE OF TECHNOLOGY\n")
    r_h1.font.name = 'Times New Roman'
    r_h1.font.size = Pt(14)
    r_h1.font.bold = True
    r_h1.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    
    r_h2 = p_hdr.add_run("NH-206, Tiptur-572201\nDEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING\nNBA Accredited 2025-28 & NAAC Accredited\n")
    r_h2.font.name = 'Times New Roman'
    r_h2.font.size = Pt(10.5)
    r_h2.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    kit_logo = 'extracted_assets/img_p1_1__IM20.jpg'
    if os.path.exists(kit_logo):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(3)
        p_logo.paragraph_format.space_after = Pt(6)
        run_logo = p_logo.add_run()
        run_logo.add_picture(kit_logo, width=Inches(0.85))

    p_decl = doc.add_paragraph()
    p_decl.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_decl.paragraph_format.space_before = Pt(6)
    p_decl.paragraph_format.space_after = Pt(14)
    r_dec = p_decl.add_run("DECLARATION")
    r_dec.font.name = 'Times New Roman'
    r_dec.font.size = Pt(16)
    r_dec.font.bold = True
    r_dec.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    decl_text = (
        "We, the students of Seventh semester, Department of Computer Science & Engineering, Kalpataru Institute of Technology, Tiptur, "
        "hereby declare that the Major Project Phase 2 (BCS786) entitled “CAREER NAVIGATOR: ENTERPRISE-GRADE AI-POWERED CAREER AND PLACEMENT "
        "READINESS PLATFORM” has been successfully completed under the guidance of Prof. Guide Name, Assistant Professor, "
        "Department of Computer Science and Engineering, Kalpataru Institute of Technology, in partial fulfillment of the course requirement for the "
        "award of degree of Bachelor of Engineering in Computer Science and Engineering of Visvesvaraya Technological University, Belagavi, "
        "during the academic year 2026-2027. Further, the matter embodied in this project report has not been submitted previously by anybody "
        "for the award of any other degree or diploma to any university."
    )
    p_body = doc.add_paragraph()
    p_body.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_body.paragraph_format.line_spacing = 1.4
    p_body.paragraph_format.space_after = Pt(12)
    r = p_body.add_run(decl_text)
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)

    # Place and Date
    p_pd = doc.add_paragraph()
    p_pd.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_pd.paragraph_format.space_before = Pt(8)
    p_pd.paragraph_format.space_after = Pt(12)
    r_pd = p_pd.add_run("Place: Tiptur\nDate: 23-10-2026")
    r_pd.font.name = 'Times New Roman'
    r_pd.font.size = Pt(11)
    r_pd.font.bold = True

    # Associates Header
    p_assoc = doc.add_paragraph()
    p_assoc.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_assoc.paragraph_format.space_before = Pt(6)
    p_assoc.paragraph_format.space_after = Pt(6)
    r_as = p_assoc.add_run("Project Associates:\n")
    r_as.font.name = 'Times New Roman'
    r_as.font.size = Pt(11)
    r_as.font.bold = True

    tblBorders = parse_xml(f'<w:tblBorders {nsdecls("w")}><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders>')
    tbl_assoc = doc.add_table(rows=4, cols=2)
    tbl_assoc.alignment = WD_TABLE_ALIGNMENT.LEFT
    tbl_assoc._tbl.tblPr.append(tblBorders)
    assoc_w = [Inches(3.2), Inches(2.8)]
    
    assoc_data = [
        ("HARSHINI P (1KI21CS001)", "Signature: ..........................................."),
        ("ANANYA S (1KI21CS002)", "Signature: ..........................................."),
        ("KIRAN KUMAR R (1KI21CS003)", "Signature: ..........................................."),
        ("DARSHAN M (1KI21CS004)", "Signature: ...........................................")
    ]
    for r_idx, (name, sig) in enumerate(assoc_data):
        for c_idx, val in enumerate([name, sig]):
            cell = tbl_assoc.cell(r_idx, c_idx)
            cell.width = assoc_w[c_idx]
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.line_spacing = 1.15
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10)

    doc.add_page_break()

def add_acknowledgement_page(doc):
    p_ack = doc.add_paragraph()
    p_ack.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_ack.paragraph_format.space_before = Pt(8)
    p_ack.paragraph_format.space_after = Pt(14)
    r_ack = p_ack.add_run("ACKNOWLEDGEMENT")
    r_ack.font.name = 'Times New Roman'
    r_ack.font.size = Pt(16)
    r_ack.font.bold = True
    r_ack.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    ack_paragraphs = [
        "The knowledge & satisfaction that accompany the successful completion of any task would be incomplete without mention of people who made it possible, whose guidance and encouragement crowned our effort with success. We would like to thank all and acknowledge the help we have received to carry out this project.",
        "We would like to convey our sincere thanks to Principal Dr. Sateesh Kumar H C, Kalpataru Institute of Technology, and Dr. Maithri C, Professor and Head, Department of Computer Science and Engineering, KIT, Tiptur for being kind enough to provide the necessary support and state-of-the-art laboratory facilities to carry out the Project.",
        "We would like to acknowledge the support we have received from the project coordinators Dr. Sanjay Kumar N V, Professor and Dr. Kavitha M G, Assoc. Prof., for understanding the requirements to be met at each phase of the project and for their constructive feedback during all internal evaluation reviews.",
        "We are most humbled to mention the enthusiastic influence provided by our guide Prof. Guide Name, Assistant Professor on the project for the ideas, time to time suggestions for being a constant support and co-operation showed during the venture and making this project a great success. We would also take this opportunity to thank our friends and family for their constant support and help.",
        "We are very much pleased to express our sincere gratitude to the friendly co-operation shown by all the faculty and technical staff members of the Computer Science & Engineering Department, Kalpataru Institute of Technology, Tiptur."
    ]

    for para in ack_paragraphs:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = 1.45
        p.paragraph_format.space_after = Pt(8)
        r = p.add_run(para)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11)

    p_thanks = doc.add_paragraph()
    p_thanks.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_thanks.paragraph_format.space_before = Pt(14)
    p_thanks.paragraph_format.space_after = Pt(4)
    r_th = p_thanks.add_run("Thanking You,\n\nNames of the students\nHARSHINI P (1KI21CS001)\nANANYA S (1KI21CS002)\nKIRAN KUMAR R (1KI21CS003)\nDARSHAN M (1KI21CS004)")
    r_th.font.name = 'Times New Roman'
    r_th.font.size = Pt(10.5)
    r_th.font.bold = True

    doc.add_page_break()

def add_abstract_page(doc):
    p_abs = doc.add_paragraph()
    p_abs.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_abs.paragraph_format.space_before = Pt(8)
    p_abs.paragraph_format.space_after = Pt(14)
    r_abs = p_abs.add_run("ABSTRACT")
    r_abs.font.name = 'Times New Roman'
    r_abs.font.size = Pt(16)
    r_abs.font.bold = True
    r_abs.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    abstract_text = (
        "Undergraduate computer science students frequently encounter rejection in campus recruitment funnels due to opaque Applicant Tracking System "
        "(ATS) resume filters, conversational interview anxiety, and lack of structured practice in articulating code solutions. "
        "Career Navigator introduces an integrated, AI-powered placement readiness web platform built to address these preparation challenges. "
        "The platform combines a deterministic resume analysis engine with generative multimodal interview simulations. "
        "The ATS module uses unicode text normalization, section boundary detection, DJB2 content hashing, and keyword density modeling to score resumes "
        "and compare them against employer job descriptions. An interactive mock interview room leverages Google Gemini 2.5 Flash, streaming real-time "
        "tokenized feedback through Server-Sent Events (SSE) while measuring speech cadence (Words Per Minute) and filler word frequency via the Web Audio API. "
        "An embedded Monaco Code Lab executes client-side programming challenges, performing static Big-O time and space complexity audits. "
        "Built on a full-stack TypeScript architecture using React 19, Express, double-submit CSRF protection, and HMAC SHA-256 session integrity, "
        "Career Navigator provides an accessible, objective, and privacy-preserving placement practice environment for engineering students."
    )

    p_body = doc.add_paragraph()
    p_body.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_body.paragraph_format.line_spacing = 1.45
    p_body.paragraph_format.space_after = Pt(10)
    r = p_body.add_run(abstract_text)
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11.5)

    # Keywords paragraph
    p_kw = doc.add_paragraph()
    p_kw.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_kw.paragraph_format.space_before = Pt(10)
    r_kwh = p_kw.add_run("Keywords: ")
    r_kwh.font.name = 'Times New Roman'
    r_kwh.font.size = Pt(11)
    r_kwh.font.bold = True
    
    r_kwt = p_kw.add_run("Applicant Tracking System (ATS), Mock Interview Simulation, Gemini 2.5 Flash, Server-Sent Events (SSE), Monaco Code Lab, Big-O Complexity, Speech Cadence Telemetry, OWASP Security.")
    r_kwt.font.name = 'Times New Roman'
    r_kwt.font.size = Pt(11)
    r_kwt.font.italic = True

    doc.add_page_break()

def add_toc_page(doc, page_map=None):
    p_toc = doc.add_paragraph()
    p_toc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_toc.paragraph_format.space_before = Pt(8)
    p_toc.paragraph_format.space_after = Pt(12)
    r_toc = p_toc.add_run("TABLE OF CONTENTS")
    r_toc.font.name = 'Times New Roman'
    r_toc.font.size = Pt(16)
    r_toc.font.bold = True
    r_toc.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    pm = page_map or {}
    def get_pg(key, default_val):
        return str(pm.get(key, default_val))

    toc_items = [
        ("CHAPTER 1: INTRODUCTION", f"{get_pg('CH1', '1')} - {get_pg('CH2_START_MINUS_1', '8')}", True, 0),
        ("1.1  Overview", get_pg("SEC_1_1", "1"), False, 1),
        ("1.2  Objectives", get_pg("SEC_1_2", "3"), False, 1),
        ("1.3  Purpose, Scope, and Applicability", get_pg("SEC_1_3", "4"), False, 1),
        ("1.3.1  Purpose", get_pg("SEC_1_3_1", "4"), False, 2),
        ("1.3.2  Scope", get_pg("SEC_1_3_2", "4"), False, 2),
        ("1.3.3  Target Stakeholder Ecosystem", get_pg("SEC_1_3_3", "5"), False, 2),
        ("1.3.4  Operational Assumptions and Environmental Constraints", get_pg("SEC_1_3_4", "6"), False, 2),
        ("1.4  Organization of Report", get_pg("SEC_1_4", "6"), False, 1),
        ("CHAPTER 2: LITERATURE SURVEY", f"{get_pg('CH2', '9')} - {get_pg('CH3_START_MINUS_1', '20')}", True, 0),
        ("2.1  Introduction", get_pg("SEC_2_1", "9"), False, 1),
        ("2.2  Summary of Papers", get_pg("SEC_2_2", "10"), False, 1),
        ("2.3  Drawbacks of Existing Systems", get_pg("SEC_2_3", "18"), False, 1),
        ("2.4  Problem Statement", get_pg("SEC_2_4", "19"), False, 1),
        ("2.5  Proposed Solution", get_pg("SEC_2_5", "20"), False, 1),
        ("CHAPTER 3: REQUIREMENT ENGINEERING", f"{get_pg('CH3', '21')} - {get_pg('CH4_START_MINUS_1', '34')}", True, 0),
        ("3.1  Software and Hardware Tools Used", get_pg("SEC_3_1", "21"), False, 1),
        ("3.2  Conceptual / Analysis Modeling", get_pg("SEC_3_2", "23"), False, 1),
        ("3.2.1  Use Case Modeling", get_pg("SEC_3_2_1", "23"), False, 2),
        ("3.2.2  Sequence Diagram & Interactive Lifecycles", get_pg("SEC_3_2_2", "25"), False, 2),
        ("3.2.3  Activity Diagram & Processing Pipelines", get_pg("SEC_3_2_3", "27"), False, 2),
        ("3.3  Software Requirements Specification", get_pg("SEC_3_3", "28"), False, 1),
        ("3.3.1  User Requirements", get_pg("SEC_3_3_1", "28"), False, 2),
        ("3.3.2  System Requirements", get_pg("SEC_3_3_2", "29"), False, 2),
        ("3.3.3  External Interface Specifications", get_pg("SEC_3_3_3", "33"), False, 2),
        ("CHAPTER 4: PROJECT PLANNING", f"{get_pg('CH4', '35')} - {get_pg('CH5_START_MINUS_1', '42')}", True, 0),
        ("4.1  Project Planning and Scheduling", get_pg("SEC_4_1", "35"), False, 1),
        ("4.1.1  Work Breakdown Structure (WBS)", get_pg("SEC_4_1_1", "35"), False, 2),
        ("4.1.2  Gantt Chart Timeline & Milestone Scheduling", get_pg("SEC_4_1_2", "37"), False, 2),
        ("4.1.3  Agile Sprint Breakdown & Deliverables", get_pg("SEC_4_1_3", "38"), False, 2),
        ("4.1.4  Risk Assessment & Mitigation Matrix", get_pg("SEC_4_1_4", "39"), False, 2),
        ("4.1.5  Effort and Resource Estimation via COCOMO II", get_pg("SEC_4_1_5", "41"), False, 2),
        ("CHAPTER 5: SYSTEM DESIGN", f"{get_pg('CH5', '43')} - {get_pg('CH6_START_MINUS_1', '58')}", True, 0),
        ("5.1  System Architecture", get_pg("SEC_5_1", "43"), False, 1),
        ("5.2  Component Design / Module Decomposition", get_pg("SEC_5_2", "45"), False, 1),
        ("5.3  Interface Design", get_pg("SEC_5_3", "46"), False, 1),
        ("5.3.1  UI/UX Design Tokens & Accessibility Standards", get_pg("SEC_5_3_1", "47"), False, 2),
        ("5.4  Data Structure Design", get_pg("SEC_5_4", "49"), False, 1),
        ("5.4.1  Relational Database Migration Bridge", get_pg("SEC_5_4_1", "53"), False, 2),
        ("5.5  Algorithm Design", get_pg("SEC_5_5", "54"), False, 1),
        ("CHAPTER 6: IMPLEMENTATION", f"{get_pg('CH6', '61')} - {get_pg('CH7_START_MINUS_1', '74')}", True, 0),
        ("6.1  Implementation Approaches", get_pg("SEC_6_1", "61"), False, 1),
        ("6.2  Coding Details and Code Efficiency", get_pg("SEC_6_2", "62"), False, 1),
        ("6.2.8  Local Heuristic Simulation Engine (Offline Fallback)", get_pg("SEC_6_2_8", "72"), False, 2),
        ("6.2.9  Web Speech API Audio Context Polyfill", get_pg("SEC_6_2_9", "73"), False, 2),
        ("6.3  Code Efficiency, Memory Profiling and Optimizations", get_pg("SEC_6_3", "74"), False, 1),
        ("CHAPTER 7: TESTING", f"{get_pg('CH7', '76')} - {get_pg('CH8_START_MINUS_1', '85')}", True, 0),
        ("7.1  Testing Approach", get_pg("SEC_7_1", "76"), False, 1),
        ("7.1.1  Unit Testing Framework & Vitest Suite", get_pg("SEC_7_1_1", "76"), False, 2),
        ("7.1.2  Code Listings of Automated Vitest Test Suites", get_pg("SEC_7_1_2", "78"), False, 2),
        ("7.1.3  Performance, Concurrency, and Load Testing", get_pg("SEC_7_1_3", "80"), False, 2),
        ("7.1.4  Security and Penetration Testing", get_pg("SEC_7_1_4", "81"), False, 2),
        ("7.1.5  Exhaustive Test Case Execution Matrix", get_pg("SEC_7_1_5", "82"), False, 2),
        ("7.1.6  Continuous Integration & Code Quality Pipeline", get_pg("SEC_7_1_6", "84"), False, 2),
        ("CHAPTER 8: RESULTS DISCUSSION AND PERFORMANCE ANALYSIS", f"{get_pg('CH8', '86')} - {get_pg('CH9_START_MINUS_1', '94')}", True, 0),
        ("8.1  Results & Quantitative Evaluation", get_pg("SEC_8_1", "86"), False, 1),
        ("8.1.1  Inference & Streaming Latency Telemetry", get_pg("SEC_8_1_1", "86"), False, 2),
        ("8.1.2  ATS Scoring Validation vs Human Recruiter Benchmarks", get_pg("SEC_8_1_2", "88"), False, 2),
        ("8.1.3  Speech Analytics & Vocal Cadence Correlation", get_pg("SEC_8_1_3", "90"), False, 2),
        ("8.1.4  Code Lab Complexity Review Accuracy", get_pg("SEC_8_1_4", "91"), False, 2),
        ("8.2  Snapshots & UI Architectural Walkthrough", get_pg("SEC_8_2", "93"), False, 1),
        ("8.3  Comparative Analysis with Existing Solutions", get_pg("SEC_8_3", "94"), False, 1),
        ("8.4  User Usability Survey & SUS Evaluation", get_pg("SEC_8_4", "95"), False, 1),
        ("CHAPTER 9: APPLICATIONS & CONCLUSION", f"{get_pg('CH9', '95')} - {get_pg('REF_START_MINUS_1', '97')}", True, 0),
        ("9.1  Applications", get_pg("SEC_9_1", "95"), False, 1),
        ("9.2  Conclusion", get_pg("SEC_9_2", "96"), False, 1),
        ("9.3  Future Scope of the Work", get_pg("SEC_9_3", "97"), False, 1),
        ("REFERENCES", get_pg("CH_REF", "98"), True, 0),
        ("ANNEXURE A: GLOSSARY", get_pg("CH_ANNEX_A", "101"), True, 0),
        ("ANNEXURE B: PAPER PUBLICATION DRAFT", get_pg("CH_ANNEX_B", "104"), True, 0),
        ("ANNEXURE C: PROJECT EXHIBITION & FUNDING DETAILS", get_pg("CH_ANNEX_C", "107"), True, 0)
    ]

    tbl_toc = doc.add_table(rows=len(toc_items) + 1, cols=2)
    tbl_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    tblBorders = parse_xml(f'<w:tblBorders {nsdecls("w")}><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders>')
    tbl_toc._tbl.tblPr.append(tblBorders)
    
    col_w = [Inches(5.15), Inches(0.85)]
    
    # Header
    cell_h1 = tbl_toc.cell(0, 0)
    cell_h2 = tbl_toc.cell(0, 1)
    cell_h1.width = col_w[0]
    cell_h2.width = col_w[1]
    p_h1 = cell_h1.paragraphs[0]
    p_h2 = cell_h2.paragraphs[0]
    p_h1.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_h2.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r1 = p_h1.add_run("Title")
    r2 = p_h2.add_run("Page no.")
    r1.font.name = 'Times New Roman'
    r2.font.name = 'Times New Roman'
    r1.font.bold = True
    r2.font.bold = True
    r1.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    r2.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

    for idx, (title, page, is_major, indent_level) in enumerate(toc_items):
        cell_t = tbl_toc.cell(idx + 1, 0)
        cell_p = tbl_toc.cell(idx + 1, 1)
        cell_t.width = col_w[0]
        cell_p.width = col_w[1]
        
        pt = cell_t.paragraphs[0]
        pp = cell_p.paragraphs[0]
        pt.alignment = WD_ALIGN_PARAGRAPH.LEFT
        pp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        pt.paragraph_format.space_after = Pt(1.5)
        pp.paragraph_format.space_after = Pt(1.5)
        pt.paragraph_format.line_spacing = 1.1
        pp.paragraph_format.line_spacing = 1.1
        
        indent_str = "    " * indent_level
        rt = pt.add_run(indent_str + title)
        rp = pp.add_run(str(page))
        
        rt.font.name = 'Times New Roman'
        rp.font.name = 'Times New Roman'
        
        if is_major:
            rt.font.bold = True
            rp.font.bold = True
            rt.font.size = Pt(10)
            rp.font.size = Pt(10)
            rt.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
        else:
            rt.font.size = Pt(9.5)
            rp.font.size = Pt(9.5)
            rt.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    doc.add_page_break()

def add_list_of_figures_page(doc, page_map=None):
    p_lof = doc.add_paragraph()
    p_lof.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_lof.paragraph_format.space_before = Pt(8)
    p_lof.paragraph_format.space_after = Pt(14)
    r_lof = p_lof.add_run("LIST OF FIGURES")
    r_lof.font.name = 'Times New Roman'
    r_lof.font.size = Pt(16)
    r_lof.font.bold = True
    r_lof.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    pm = page_map or {}
    def get_pg(key, default_val):
        return str(pm.get(key, default_val))

    figures = [
        ("Figure 1.1", "Paradigm Comparison: Traditional Placement Prep vs Career Navigator Platform", get_pg("FIG_1_1", "2")),
        ("Figure 2.1", "Taxonomy of Artificial Intelligence in Candidate Evaluation and Recruitment Technology", get_pg("FIG_2_1", "9")),
        ("Figure 3.1", "UML Use Case Diagram: Candidate and Administrator Interaction Spaces", get_pg("FIG_3_1", "23")),
        ("Figure 3.2", "UML Sequence Diagram: Real-Time SSE Mock Interview Lifecycle", get_pg("FIG_3_2", "26")),
        ("Figure 3.3", "UML Activity Diagram: Dual-Phase Resume ATS Ingestion & Analysis Pipeline", get_pg("FIG_3_3", "28")),
        ("Figure 4.1", "Project Execution Gantt Chart: Work Breakdown Structure Across 26 Weeks", get_pg("FIG_4_1", "37")),
        ("Figure 5.1", "High-Level Tiered Enterprise System Architecture of Career Navigator", get_pg("FIG_5_1", "44")),
        ("Figure 5.3", "Entity-Relationship (ER) Logical Schema Diagram of Career Navigator", get_pg("FIG_5_3", "50")),
        ("Figure 7.1", "Vitest Test Execution Results by Functional Module (100% Pass Rate)", get_pg("FIG_7_1", "77")),
        ("Figure 8.1", "Latency Benchmark: Time-To-First-Token (TTFT) and End-to-End Evaluation Latency", get_pg("FIG_8_1", "87")),
        ("Figure 8.2", "ATS Score Distribution and Human Recruiter Correlation (R^2 = 0.892)", get_pg("FIG_8_2", "89"))
    ]

    tbl_lof = doc.add_table(rows=len(figures) + 1, cols=3)
    tbl_lof.alignment = WD_TABLE_ALIGNMENT.CENTER
    tblBorders = parse_xml(f'<w:tblBorders {nsdecls("w")}><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders>')
    tbl_lof._tbl.tblPr.append(tblBorders)
    
    col_w = [Inches(1.10), Inches(4.15), Inches(0.75)]
    
    # Header
    for c_idx, h_text in enumerate(["Figure No.", "Figure Name", "Page No."]):
        cell = tbl_lof.cell(0, c_idx)
        cell.width = col_w[c_idx]
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT if c_idx == 2 else WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(h_text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

    for idx, (f_no, f_name, page) in enumerate(figures):
        for c_idx, val in enumerate([f_no, f_name, page]):
            cell = tbl_lof.cell(idx + 1, c_idx)
            cell.width = col_w[c_idx]
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT if c_idx == 2 else WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_after = Pt(2.5)
            p.paragraph_format.line_spacing = 1.1
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(9.5)
            if c_idx == 0:
                r.font.bold = True

    doc.add_page_break()

def add_list_of_tables_page(doc, page_map=None):
    # Professional 3-column List of Tables
    p_lot = doc.add_paragraph()
    p_lot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_lot.paragraph_format.space_before = Pt(4)
    p_lot.paragraph_format.space_after = Pt(8)
    r_lot = p_lot.add_run("LIST OF TABLES")
    r_lot.font.name = 'Times New Roman'
    r_lot.font.size = Pt(16)
    r_lot.font.bold = True
    r_lot.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    pm = page_map or {}
    def get_pg(key, default_val):
        return str(pm.get(key, default_val))

    tables = [
        ("Table 1.1", "Measurable Engineering Objectives, Key Performance Indicators (KPIs), and Target SLAs", get_pg("TBL_1_1", "3")),
        ("Table 1.2", "Comprehensive Stakeholder Analysis and Value Proposition Matrix", get_pg("TBL_1_2", "5")),
        ("Table 2.1", "Comprehensive Comparative Literature Analysis Matrix of Surveyed Research Papers", get_pg("TBL_2_1", "17")),
        ("Table 2.2", "Comprehensive Feature Matrix: Career Navigator vs Existing Commercial and Academic Solutions", get_pg("TBL_2_2", "20")),
        ("Table 3.1", "Hardware Environment Specifications for Development and Production Deployment", get_pg("TBL_3_1", "21")),
        ("Table 3.2", "Complete Software Technology Stack, Libraries, and Architectural Justifications", get_pg("TBL_3_2", "22")),
        ("Table 3.3", "Comprehensive Use Case Specifications (UC01 - UC10)", get_pg("TBL_3_3", "24")),
        ("Table 3.4", "Comprehensive Functional Requirements Specifications (FR01 - FR25)", get_pg("TBL_3_4", "30")),
        ("Table 3.5", "Non-Functional System Performance, Security, and Scalability Requirements", get_pg("TBL_3_5", "32")),
        ("Table 4.1", "Comprehensive Work Breakdown Structure (WBS) Dictionary and Task Allocation", get_pg("TBL_4_1", "36")),
        ("Table 4.2", "Agile Sprint Scheduling, Velocity, Story Points, and Milestone Deliverables", get_pg("TBL_4_2", "38")),
        ("Table 4.3", "Systematic Technical, Algorithmic, Operational, and Institutional Risk Assessment Matrix", get_pg("TBL_4_3", "40")),
        ("Table 5.1", "Comprehensive OpenAPI 3.0.3 REST and Server-Sent Events API Endpoint Contracts", get_pg("TBL_5_1", "47")),
        ("Table 5.2", "Physical Data Dictionary — User Entity (`users`)", get_pg("TBL_5_2", "49")),
        ("Table 5.3", "Physical Data Dictionary — StudentProfile Entity (`student_profiles`)", get_pg("TBL_5_3", "49")),
        ("Table 5.4", "Physical Data Dictionary — ResumeAnalysis Entity (`resume_analyses`)", get_pg("TBL_5_4", "50")),
        ("Table 5.5", "Physical Data Dictionary — MockInterview Entity (`mock_interviews`)", get_pg("TBL_5_5", "51")),
        ("Table 5.6", "Physical Data Dictionary — CodeSubmission Entity (`code_submissions`)", get_pg("TBL_5_6", "51")),
        ("Table 7.1", "Apache JMeter / Artillery Concurrent Load Test Benchmarks", get_pg("TBL_7_1", "80")),
        ("Table 7.2", "Exhaustive Vitest Test Suite Execution and Verification Matrix (TC01 - TC50)", get_pg("TBL_7_2", "82")),
        ("Table 8.1", "Empirical Generative AI Streaming Latency and Throughput Benchmarks", get_pg("TBL_8_1", "87")),
        ("Table 8.2", "Statistical Correlation: Career Navigator ATS Engine vs Human Recruiter Panel", get_pg("TBL_8_2", "89")),
        ("Table 8.3", "Speech Telemetry and Vocal Cadence Accuracy Validation", get_pg("TBL_8_3", "90")),
        ("Table 8.4", "Algorithmic Big-O Complexity Detection Accuracy across Standard Algorithms", get_pg("TBL_8_4", "91")),
        ("Table 8.5", "Comparative Evaluation of Career Navigator against Existing Industry Platforms", get_pg("TBL_8_5", "94")),
        ("Table 8.6", "System Usability Scale (SUS) Evaluation Metrics and Student Survey Feedback", get_pg("TBL_8_6", "92")),
        ("Table C.1", "State-Level Project Exhibition Official Evaluation Scorecard", get_pg("TBL_C_1", "107"))
    ]

    tbl_lot = doc.add_table(rows=len(tables) + 1, cols=3)
    tbl_lot.alignment = WD_TABLE_ALIGNMENT.CENTER
    tblBorders = parse_xml(f'<w:tblBorders {nsdecls("w")}><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders>')
    tbl_lot._tbl.tblPr.append(tblBorders)
    
    col_w = [Inches(1.10), Inches(4.15), Inches(0.75)]
    
    # Header Row
    for c_idx, h_text in enumerate(["Table No.", "Title", "Page No."]):
        cell = tbl_lot.cell(0, c_idx)
        cell.width = col_w[c_idx]
        set_cell_margins(cell, top=20, bottom=20, left=40, right=40)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT if c_idx == 2 else WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(h_text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(9.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

    # Data Rows
    for idx, (t_no, t_name, page) in enumerate(tables):
        trPr = tbl_lot.rows[idx + 1]._tr.get_or_add_trPr()
        trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
        
        for c_idx, val in enumerate([t_no, t_name, page]):
            cell = tbl_lot.cell(idx + 1, c_idx)
            cell.width = col_w[c_idx]
            set_cell_margins(cell, top=20, bottom=20, left=40, right=40)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT if c_idx == 2 else WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_after = Pt(1.0)
            p.paragraph_format.line_spacing = 1.0
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(8.5)
            if c_idx == 0:
                r.font.bold = True

    doc.add_page_break()
