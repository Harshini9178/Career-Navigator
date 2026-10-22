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
    # Title Page / Outer Cover Page
    # Top VTU Header
    p_univ = doc.add_paragraph()
    p_univ.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_univ.paragraph_format.space_before = Pt(4)
    p_univ.paragraph_format.space_after = Pt(2)
    p_univ.paragraph_format.line_spacing = 1.15
    r_u1 = p_univ.add_run("VISVESVARAYA TECHNOLOGICAL UNIVERSITY\n")
    r_u1.font.name = 'Times New Roman'
    r_u1.font.size = Pt(14)
    r_u1.font.bold = True
    r_u1.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    
    r_u2 = p_univ.add_run("“Jnana Sangama”, Belagavi-590018, Karnataka\n")
    r_u2.font.name = 'Times New Roman'
    r_u2.font.size = Pt(11)
    r_u2.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
    
    # VTU Logo
    vtu_logo = 'extracted_assets/img_p1_2__IM21.jpg'
    if os.path.exists(vtu_logo):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(6)
        p_logo.paragraph_format.space_after = Pt(8)
        run_logo = p_logo.add_run()
        run_logo.add_picture(vtu_logo, width=Inches(1.05))

    # Project Report Text
    p_rep = doc.add_paragraph()
    p_rep.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_rep.paragraph_format.space_before = Pt(4)
    p_rep.paragraph_format.space_after = Pt(2)
    p_rep.paragraph_format.line_spacing = 1.15
    r_rep1 = p_rep.add_run("A PROJECT REPORT (BCS786)\n")
    r_rep1.font.name = 'Times New Roman'
    r_rep1.font.size = Pt(13)
    r_rep1.font.bold = True
    r_rep1.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    
    r_rep2 = p_rep.add_run("on\n")
    r_rep2.font.name = 'Times New Roman'
    r_rep2.font.size = Pt(11)
    
    # Project Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(4)
    p_title.paragraph_format.space_after = Pt(8)
    p_title.paragraph_format.line_spacing = 1.2
    r_title = p_title.add_run("“CAREER NAVIGATOR: ENTERPRISE-GRADE AI-POWERED CAREER AND PLACEMENT READINESS PLATFORM”\n")
    r_title.font.name = 'Times New Roman'
    r_title.font.size = Pt(14)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    # Fulfillment statement
    p_ful = doc.add_paragraph()
    p_ful.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_ful.paragraph_format.space_before = Pt(4)
    p_ful.paragraph_format.space_after = Pt(8)
    p_ful.paragraph_format.line_spacing = 1.15
    r_ful = p_ful.add_run("Submitted in partial fulfillment of the requirements for the award of the degree of\nBachelor of Engineering\nin\nComputer Science & Engineering\n")
    r_ful.font.name = 'Times New Roman'
    r_ful.font.size = Pt(10.5)
    r_ful.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    # Submitted by header
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(4)
    p_sub.paragraph_format.space_after = Pt(4)
    r_sub = p_sub.add_run("Submitted by\n")
    r_sub.font.name = 'Times New Roman'
    r_sub.font.size = Pt(11)
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
            else:
                r.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)

    # Guidance block
    p_guid = doc.add_paragraph()
    p_guid.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_guid.paragraph_format.space_before = Pt(8)
    p_guid.paragraph_format.space_after = Pt(2)
    p_guid.paragraph_format.line_spacing = 1.15
    r_g1 = p_guid.add_run("Under the Guidance of\n")
    r_g1.font.name = 'Times New Roman'
    r_g1.font.size = Pt(10.5)
    r_g1.font.bold = True
    
    r_g2 = p_guid.add_run("Dr. / Prof. Project Guide Name\nAssistant Professor\nDepartment of CS&E, KIT, Tiptur-572201\n")
    r_g2.font.name = 'Times New Roman'
    r_g2.font.size = Pt(10)
    r_g2.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    # College Logo
    kit_logo = 'extracted_assets/img_p1_1__IM20.jpg'
    if os.path.exists(kit_logo):
        p_kit = doc.add_paragraph()
        p_kit.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_kit.paragraph_format.space_before = Pt(4)
        p_kit.paragraph_format.space_after = Pt(4)
        run_kit = p_kit.add_run()
        run_kit.add_picture(kit_logo, width=Inches(0.95))

    # College Department Footer Block
    p_dept = doc.add_paragraph()
    p_dept.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_dept.paragraph_format.space_before = Pt(2)
    p_dept.paragraph_format.space_after = Pt(0)
    p_dept.paragraph_format.line_spacing = 1.15
    
    r_d1 = p_dept.add_run("DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING\n")
    r_d1.font.name = 'Times New Roman'
    r_d1.font.size = Pt(12)
    r_d1.font.bold = True
    r_d1.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    
    r_d2 = p_dept.add_run("KALPATARU INSTITUTE OF TECHNOLOGY\n")
    r_d2.font.name = 'Times New Roman'
    r_d2.font.size = Pt(13)
    r_d2.font.bold = True
    r_d2.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    
    r_d3 = p_dept.add_run("NBA Accredited 2025-28 & NAAC Accredited\nN H-206, Tiptur-572201\n2026-2027")
    r_d3.font.name = 'Times New Roman'
    r_d3.font.size = Pt(9.5)
    r_d3.font.bold = True
    r_d3.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    doc.add_page_break()

def add_certificate_page(doc):
    # Header
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
    r_h2.font.size = Pt(10)
    
    r_h3 = p_hdr.add_run("DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING\n")
    r_h3.font.name = 'Times New Roman'
    r_h3.font.size = Pt(11.5)
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
        p_logo.paragraph_format.space_before = Pt(4)
        p_logo.paragraph_format.space_after = Pt(8)
        run_logo = p_logo.add_run()
        run_logo.add_picture(kit_logo, width=Inches(0.95))

    p_cert = doc.add_paragraph()
    p_cert.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cert.paragraph_format.space_before = Pt(6)
    p_cert.paragraph_format.space_after = Pt(12)
    r_cert = p_cert.add_run("Certificate")
    r_cert.font.name = 'Times New Roman'
    r_cert.font.size = Pt(18)
    r_cert.font.bold = True
    r_cert.font.italic = True
    r_cert.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    p_body = doc.add_paragraph()
    p_body.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_body.paragraph_format.line_spacing = 1.35
    p_body.paragraph_format.space_after = Pt(8)
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
    p_body2.paragraph_format.line_spacing = 1.35
    p_body2.paragraph_format.space_before = Pt(8)
    p_body2.paragraph_format.space_after = Pt(18)
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
    tbl_sig = doc.add_table(rows=2, cols=3)
    tbl_sig.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_sig._tbl.tblPr.append(tblBorders)
    sig_w = [Inches(2.0), Inches(2.0), Inches(2.0)]
    
    sigs = [
        ("Signature of Guide\n\n\n\nGuide Name\nDesignation\nDept. of CSE",
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
    p_viva.paragraph_format.space_before = Pt(20)
    p_viva.paragraph_format.space_after = Pt(4)
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
            p.paragraph_format.space_after = Pt(4)
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
    r_h2.font.size = Pt(10)
    r_h2.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    kit_logo = 'extracted_assets/img_p1_1__IM20.jpg'
    if os.path.exists(kit_logo):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(4)
        p_logo.paragraph_format.space_after = Pt(8)
        run_logo = p_logo.add_run()
        run_logo.add_picture(kit_logo, width=Inches(0.95))

    p_dec = doc.add_paragraph()
    p_dec.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_dec.paragraph_format.space_before = Pt(8)
    p_dec.paragraph_format.space_after = Pt(16)
    r_dec = p_dec.add_run("DECLARATION")
    r_dec.font.name = 'Times New Roman'
    r_dec.font.size = Pt(16)
    r_dec.font.bold = True
    r_dec.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    p_body = doc.add_paragraph()
    p_body.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_body.paragraph_format.line_spacing = 1.5
    p_body.paragraph_format.space_after = Pt(12)
    r_b = p_body.add_run(
        "We, the students of Seventh semester, Department of Computer Science & Engineering, Kalpataru Institute of Technology, "
        "Tiptur, would hereby declare that the Major Project Phase 2 (BCS786) entitled “CAREER NAVIGATOR: ENTERPRISE-GRADE AI-POWERED "
        "CAREER AND PLACEMENT READINESS PLATFORM” has been successfully completed under the guidance of Guide Name, "
        "Assistant Professor, Department of Computer Science and Engineering, Kalpataru Institute of Technology, in partial "
        "fulfilment of the course requirement for the award of degree of Bachelor of Engineering in Computer Science and Engineering "
        "of Visvesvaraya Technological University, Belagavi, during the academic year 2026-2027. Further, the matter embodied in "
        "the project report has not been submitted previously by anybody for the award of any other degree or diploma to any university."
    )
    r_b.font.name = 'Times New Roman'
    r_b.font.size = Pt(11.5)

    p_place = doc.add_paragraph()
    p_place.paragraph_format.space_before = Pt(16)
    p_place.paragraph_format.space_after = Pt(2)
    r_pl = p_place.add_run("Place: Tiptur\nDate: 21st October 2026")
    r_pl.font.name = 'Times New Roman'
    r_pl.font.size = Pt(11)
    r_pl.font.bold = True

    p_assoc = doc.add_paragraph()
    p_assoc.paragraph_format.space_before = Pt(16)
    p_assoc.paragraph_format.space_after = Pt(8)
    r_as = p_assoc.add_run("Project Associates:\n")
    r_as.font.name = 'Times New Roman'
    r_as.font.size = Pt(11.5)
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
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.line_spacing = 1.15
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10.5)

    doc.add_page_break()

def add_acknowledgement_page(doc):
    p_ack = doc.add_paragraph()
    p_ack.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_ack.paragraph_format.space_before = Pt(10)
    p_ack.paragraph_format.space_after = Pt(18)
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
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_after = Pt(10)
        r = p.add_run(para)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(11.5)

    p_thanks = doc.add_paragraph()
    p_thanks.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_thanks.paragraph_format.space_before = Pt(20)
    p_thanks.paragraph_format.space_after = Pt(4)
    r_th = p_thanks.add_run("Thanking You,\n\nNames of the students\nHARSHINI P (1KI21CS001)\nANANYA S (1KI21CS002)\nKIRAN KUMAR R (1KI21CS003)\nDARSHAN M (1KI21CS004)")
    r_th.font.name = 'Times New Roman'
    r_th.font.size = Pt(11)
    r_th.font.bold = True

    doc.add_page_break()

def add_abstract_page(doc):
    p_abs = doc.add_paragraph()
    p_abs.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_abs.paragraph_format.space_before = Pt(10)
    p_abs.paragraph_format.space_after = Pt(18)
    r_abs = p_abs.add_run("ABSTRACT")
    r_abs.font.name = 'Times New Roman'
    r_abs.font.size = Pt(16)
    r_abs.font.bold = True
    r_abs.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    abstract_text = (
        "Modern engineering graduates face acute challenges securing technical employment due to automated Application Tracking System "
        "(ATS) filtering algorithms, rigorous multi-round technical interviews, and severe communication anxiety. Career Navigator introduces an "
        "enterprise-grade, artificial intelligence-powered placement preparation platform architected to bridge the preparation gap. The platform "
        "synthesizes a dual-tier evaluation pipeline combining a deterministic, evidence-based ATS scoring engine with generative multimodal interview simulation. "
        "The ATS engine utilizes content-aware regex parsing, Unicode sanitization, DJB2 fingerprint caching, and keyword density modeling to score resumes "
        "and benchmark them against target Job Descriptions (JD). The conversational mock interview room leverages Google Gemini 2.5 Flash, streaming real-time "
        "tokenized feedback through Server-Sent Events (SSE) alongside automated Web Audio telemetry measuring speech cadence (Words Per Minute) and filler word frequency. "
        "An integrated Monaco Code Lab executes client-side algorithmic reviews, performing Big-O time and space complexity audits with edge-case static analysis. "
        "Built on a hardened full-stack TypeScript stack featuring React 19, Node.js Express, double-submit CSRF guards, HMAC SHA-256 session integrity, and "
        "zero-dependency cookie security, Career Navigator establishes an objective, scalable, and privacy-preserving placement readiness ecosystem."
    )

    p_body = doc.add_paragraph()
    p_body.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_body.paragraph_format.line_spacing = 1.5
    p_body.paragraph_format.space_after = Pt(12)
    r = p_body.add_run(abstract_text)
    r.font.name = 'Times New Roman'
    r.font.size = Pt(12)

    # Keywords paragraph
    p_kw = doc.add_paragraph()
    p_kw.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_kw.paragraph_format.space_before = Pt(14)
    r_kwh = p_kw.add_run("Keywords: ")
    r_kwh.font.name = 'Times New Roman'
    r_kwh.font.size = Pt(11)
    r_kwh.font.bold = True
    
    r_kwt = p_kw.add_run("Mock Interview Simulation, Applicant Tracking System (ATS), Gemini 2.5 Flash, Server-Sent Events (SSE), Monaco Code Lab, Algorithmic Big-O Analysis, Speech Telemetry, OWASP Security Baseline.")
    r_kwt.font.name = 'Times New Roman'
    r_kwt.font.size = Pt(11)
    r_kwt.font.italic = True

    doc.add_page_break()

def add_toc_page(doc):
    p_toc = doc.add_paragraph()
    p_toc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_toc.paragraph_format.space_before = Pt(10)
    p_toc.paragraph_format.space_after = Pt(16)
    r_toc = p_toc.add_run("TABLE OF CONTENTS")
    r_toc.font.name = 'Times New Roman'
    r_toc.font.size = Pt(16)
    r_toc.font.bold = True
    r_toc.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    toc_items = [
        ("CHAPTER 1: INTRODUCTION", "1 - 5", True, 0),
        ("1.1  Overview", "1", False, 1),
        ("1.2  Objectives", "2", False, 1),
        ("1.3  Purpose, Scope, and Applicability", "3", False, 1),
        ("1.3.1  Purpose", "3", False, 2),
        ("1.3.2  Scope", "4", False, 2),
        ("1.3.3  Applicability", "4", False, 2),
        ("1.4  Organization of Report", "5", False, 1),
        ("CHAPTER 2: LITERATURE SURVEY", "6 - 11", True, 0),
        ("2.1  Introduction", "6", False, 1),
        ("2.2  Summary of Papers", "7", False, 1),
        ("2.3  Drawbacks of Existing System", "10", False, 1),
        ("2.4  Problem Statement", "10", False, 1),
        ("2.5  Proposed Solution", "11", False, 1),
        ("CHAPTER 3: REQUIREMENT ENGINEERING", "12 - 19", True, 0),
        ("3.1  Software and Hardware Tools Used", "12", False, 1),
        ("3.2  Conceptual / Analysis Modeling", "14", False, 1),
        ("3.2.1  Use Case Diagram & Specifications", "14", False, 2),
        ("3.2.2  Sequence Diagram & Interactive Lifecycles", "15", False, 2),
        ("3.2.3  Activity Diagram & Processing Pipelines", "16", False, 2),
        ("3.3  Software Requirements Specification", "17", False, 1),
        ("3.3.1  User Requirements", "17", False, 2),
        ("3.3.2  System Requirements (Functional & Non-Functional)", "18", False, 2),
        ("CHAPTER 4: PROJECT PLANNING", "20 - 23", True, 0),
        ("4.1  Project Planning and Scheduling", "20", False, 1),
        ("4.1.1  Work Breakdown Structure (WBS)", "20", False, 2),
        ("4.1.2  Gantt Chart Timeline & Milestone Scheduling", "21", False, 2),
        ("4.1.3  Agile Sprint Breakdown & Deliverables", "21", False, 2),
        ("4.1.4  Comprehensive Project Risk Assessment & Mitigation", "22", False, 2),
        ("CHAPTER 5: SYSTEM DESIGN", "24 - 30", True, 0),
        ("5.1  System Architecture", "24", False, 1),
        ("5.2  Component Design / Module Decomposition", "25", False, 1),
        ("5.3  Interface Design (UI/UX Flow & OpenAPI Contract)", "26", False, 1),
        ("5.4  Data Structure Design (ER Schema & Models)", "27", False, 1),
        ("5.5  Algorithm Design (ATS Scoring, DJB2 Hash, Big-O Review)", "28", False, 1),
        ("CHAPTER 6: IMPLEMENTATION", "31 - 34", True, 0),
        ("6.1  Implementation Approaches", "31", False, 1),
        ("6.2  Coding Details and Code Efficiency", "31", False, 1),
        ("6.2.1  Resume Normalization & DJB2 Content Fingerprinting", "31", False, 2),
        ("6.2.2  OWASP Security Pipeline & Double-Submit CSRF Guard", "32", False, 2),
        ("6.2.3  HMAC SHA-256 Session Signing & Brute-Force Rate Limiting", "33", False, 2),
        ("6.2.4  Gemini SSE Streaming Token Pipeline", "34", False, 2),
        ("CHAPTER 7: TESTING", "35 - 40", True, 0),
        ("7.1  Testing Approach", "35", False, 1),
        ("7.1.1  Unit Testing Framework & Vitest Suite", "35", False, 2),
        ("7.1.2  Integrated Testing & End-to-End Lifecycles", "36", False, 2),
        ("7.1.3  Comprehensive Test Cases and Results Matrix", "36", False, 2),
        ("CHAPTER 8: RESULTS DISCUSSION AND PERFORMANCE ANALYSIS", "41 - 44", True, 0),
        ("8.1  Results & Quantitative Evaluation", "41", False, 1),
        ("8.1.1  Inference & Streaming Latency Telemetry", "41", False, 2),
        ("8.1.2  ATS Scoring Validation vs Human Recruiter Benchmarks", "42", False, 2),
        ("8.1.3  Speech Analytics & Cadence Correlation", "43", False, 2),
        ("8.2  Snapshots & UI Architectural Walkthrough", "44", False, 1),
        ("CHAPTER 9: APPLICATIONS & CONCLUSION", "45 - 46", True, 0),
        ("9.1  Applications", "45", False, 1),
        ("9.2  Conclusion", "45", False, 1),
        ("9.3  Future Scope of the Work", "46", False, 1),
        ("REFERENCES", "47 - 48", True, 0),
        ("ANNEXURE A: GLOSSARY", "49 - 50", True, 0),
        ("ANNEXURE B: Paper Publication Draft (IEEE / Springer)", "51 - 52", True, 0),
        ("ANNEXURE C: Project Exhibition Certificate / Funding Award Details", "53 - 54", True, 0)
    ]

    tbl_toc = doc.add_table(rows=len(toc_items) + 1, cols=2)
    tbl_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    tblBorders = parse_xml(f'<w:tblBorders {nsdecls("w")}><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders>')
    tbl_toc._tbl.tblPr.append(tblBorders)
    
    col_w = [Inches(5.0), Inches(1.1)]
    
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
        pt.paragraph_format.space_after = Pt(2)
        pp.paragraph_format.space_after = Pt(2)
        pt.paragraph_format.line_spacing = 1.1
        pp.paragraph_format.line_spacing = 1.1
        
        indent_str = "    " * indent_level
        rt = pt.add_run(indent_str + title)
        rp = pp.add_run(page)
        
        rt.font.name = 'Times New Roman'
        rp.font.name = 'Times New Roman'
        
        if is_major:
            rt.font.bold = True
            rp.font.bold = True
            rt.font.size = Pt(10.5)
            rp.font.size = Pt(10.5)
            rt.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
        else:
            rt.font.size = Pt(10)
            rp.font.size = Pt(10)
            rt.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    doc.add_page_break()

def add_list_of_figures_page(doc):
    p_lof = doc.add_paragraph()
    p_lof.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_lof.paragraph_format.space_before = Pt(10)
    p_lof.paragraph_format.space_after = Pt(16)
    r_lof = p_lof.add_run("LIST OF FIGURES")
    r_lof.font.name = 'Times New Roman'
    r_lof.font.size = Pt(16)
    r_lof.font.bold = True
    r_lof.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    figures = [
        ("Figure 1.1", "Paradigm Comparison: Traditional Placement Prep vs Career Navigator Platform", "2"),
        ("Figure 2.1", "Taxonomy of Artificial Intelligence in Candidate Evaluation and Recruitment Technology", "6"),
        ("Figure 3.1", "UML Use Case Diagram for Student and Administrative Personas", "14"),
        ("Figure 3.2", "UML Sequence Diagram: Real-Time SSE Mock Interview Lifecycle", "15"),
        ("Figure 3.3", "UML Activity Diagram: Dual-Phase Resume ATS Ingestion & Analysis Pipeline", "16"),
        ("Figure 4.1", "Project Execution Gantt Chart: Work Breakdown Structure Across 26 Weeks", "21"),
        ("Figure 5.1", "High-Level Tiered Enterprise System Architecture of Career Navigator", "24"),
        ("Figure 5.3", "Entity-Relationship (ER) Schema Modeling Core Relational Entities", "27"),
        ("Figure 6.1", "OWASP-Hardened Request Ingestion & Security Middleware Pipeline", "32"),
        ("Figure 7.1", "Vitest Test Execution Results by Functional Module (100% Pass Rate)", "35"),
        ("Figure 8.1", "Response Latency Benchmarking across Streaming, REST, and Local Heuristic Execution", "41"),
        ("Figure 8.2", "Validation Correlation: Career Navigator ATS Scoring vs Expert Recruiter Benchmarks", "43")
    ]

    tbl_lof = doc.add_table(rows=len(figures) + 1, cols=3)
    tbl_lof.alignment = WD_TABLE_ALIGNMENT.CENTER
    tblBorders = parse_xml(f'<w:tblBorders {nsdecls("w")}><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders>')
    tbl_lof._tbl.tblPr.append(tblBorders)
    
    col_w = [Inches(1.2), Inches(4.0), Inches(0.9)]
    
    # Header
    for c_idx, h_text in enumerate(["Figure No.", "Figure Name", "Page No."]):
        cell = tbl_lof.cell(0, c_idx)
        cell.width = col_w[c_idx]
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT if c_idx == 2 else WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(h_text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

    for idx, (f_no, f_name, page) in enumerate(figures):
        for c_idx, val in enumerate([f_no, f_name, page]):
            cell = tbl_lof.cell(idx + 1, c_idx)
            cell.width = col_w[c_idx]
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT if c_idx == 2 else WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.15
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10)
            if c_idx == 0:
                r.font.bold = True

    doc.add_page_break()

def add_list_of_tables_page(doc):
    p_lot = doc.add_paragraph()
    p_lot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_lot.paragraph_format.space_before = Pt(10)
    p_lot.paragraph_format.space_after = Pt(16)
    r_lot = p_lot.add_run("LIST OF TABLES")
    r_lot.font.name = 'Times New Roman'
    r_lot.font.size = Pt(16)
    r_lot.font.bold = True
    r_lot.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

    tables = [
        ("Table 2.1", "Comprehensive Literature Survey and Feature Matrix Comparison", "9"),
        ("Table 3.1", "Development and Production Deployment Hardware Environment Specifications", "12"),
        ("Table 3.2", "Full-Stack Software Tools, Frameworks, Middleware, and Runtime Packages", "12"),
        ("Table 3.3", "Formal Use Case Specifications for Student and Administrator Personas", "14"),
        ("Table 3.4", "Comprehensive Functional Requirements Specifications (FR1 - FR20)", "17"),
        ("Table 3.5", "Non-Functional System Performance, Security, and Scalability Requirements", "18"),
        ("Table 4.1", "Agile Sprint Scheduling, Work Packages, and Milestone Deliverables", "21"),
        ("Table 4.2", "Systematic Technical and Operational Risk Assessment & Mitigation Matrix", "22"),
        ("Table 5.1", "OpenAPI 3.0 REST and Server-Sent Events (SSE) Endpoint Contracts", "26"),
        ("Table 5.2", "Relational and JSON Entity Schema Property Definitions", "28"),
        ("Table 5.3", "Deterministic Keyword Catalog and Category Density Weights", "29"),
        ("Table 6.1", "Enterprise Security Middleware Configurations and OWASP Hardening Baseline", "33"),
        ("Table 7.1", "Exhaustive Vitest Test Suite Execution and Verification Matrix (TC01 - TC35)", "36"),
        ("Table 8.1", "Empirical Latency and Throughput Telemetry Across Execution Modes", "42"),
        ("Table 8.2", "ATS Scoring Engine Accuracy, Precision, and Confusion Classification", "43"),
        ("Table 8.3", "Speech Analytics Cadence Evaluation across Word Per Minute Profiles", "43")
    ]

    tbl_lot = doc.add_table(rows=len(tables) + 1, cols=3)
    tbl_lot.alignment = WD_TABLE_ALIGNMENT.CENTER
    tblBorders = parse_xml(f'<w:tblBorders {nsdecls("w")}><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders>')
    tbl_lot._tbl.tblPr.append(tblBorders)
    
    col_w = [Inches(1.2), Inches(4.0), Inches(0.9)]
    
    for c_idx, h_text in enumerate(["Table No.", "Title", "Page No."]):
        cell = tbl_lot.cell(0, c_idx)
        cell.width = col_w[c_idx]
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT if c_idx == 2 else WD_ALIGN_PARAGRAPH.LEFT
        r = p.add_run(h_text)
        r.font.name = 'Times New Roman'
        r.font.size = Pt(10.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

    for idx, (t_no, t_name, page) in enumerate(tables):
        for c_idx, val in enumerate([t_no, t_name, page]):
            cell = tbl_lot.cell(idx + 1, c_idx)
            cell.width = col_w[c_idx]
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT if c_idx == 2 else WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_after = Pt(3)
            p.paragraph_format.line_spacing = 1.15
            r = p.add_run(val)
            r.font.name = 'Times New Roman'
            r.font.size = Pt(10)
            if c_idx == 0:
                r.font.bold = True

    doc.add_page_break()
