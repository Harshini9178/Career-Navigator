import os
import sys
import shutil
import docx
from docx import Document
from docx.shared import Inches, Pt
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

# Ensure generator path is in sys.path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from styles import (
    set_document_margins, configure_styles, setup_header_footer
)
from prelims import (
    add_cover_page, add_certificate_page, add_declaration_page,
    add_acknowledgement_page, add_abstract_page, add_toc_page,
    add_list_of_figures_page, add_list_of_tables_page
)
from chapters_1_to_3 import build_chapters_1_to_3
from chapters_4_to_6 import build_chapters_4_to_6
from chapters_7_to_9 import build_chapters_7_to_9
from references_annexures import build_references_annexures

def build_document(page_map=None):
    doc = Document()
    configure_styles(doc)

    # =========================================================================
    # SECTION 1: PRELIMINARY PAGES (ROMAN NUMERALS i, ii, iii...)
    # =========================================================================
    sec1 = doc.sections[0]
    set_document_margins(sec1, top=1.0, bottom=1.0, left=1.25, right=1.0)
    sec1.different_first_page_header_footer = True
    
    # Set Roman lower numbering: i, ii, iii...
    pgNumType1 = parse_xml(f'<w:pgNumType {nsdecls("w")} w:fmt="romanLower" w:start="1"/>')
    sec1._sectPr.append(pgNumType1)
    setup_header_footer(sec1, is_prelims=True)

    add_cover_page(doc)
    add_certificate_page(doc)
    add_declaration_page(doc)
    add_acknowledgement_page(doc)
    add_abstract_page(doc)
    add_toc_page(doc, page_map)
    add_list_of_figures_page(doc, page_map)
    add_list_of_tables_page(doc, page_map)

    # =========================================================================
    # SECTION 2: MAIN REPORT CHAPTERS (ARABIC NUMERALS 1, 2, 3...)
    # =========================================================================
    sec2 = doc.add_section()
    set_document_margins(sec2, top=1.0, bottom=1.0, left=1.25, right=1.0)
    sec2.header.is_linked_to_previous = False
    sec2.footer.is_linked_to_previous = False
    
    # Set Decimal numbering: 1, 2, 3...
    pgNumType2 = parse_xml(f'<w:pgNumType {nsdecls("w")} w:fmt="decimal" w:start="1"/>')
    sec2._sectPr.append(pgNumType2)
    setup_header_footer(sec2, is_prelims=False)

    build_chapters_1_to_3(doc)
    build_chapters_4_to_6(doc)
    build_chapters_7_to_9(doc)
    build_references_annexures(doc)

    return doc

def scan_page_numbers_via_word(docx_path):
    import win32com.client
    import pythoncom
    pythoncom.CoInitialize()
    
    word = win32com.client.DispatchEx("Word.Application")
    word.Visible = False
    word.DisplayAlerts = False
    
    doc_word = word.Documents.Open(os.path.abspath(docx_path))
    
    page_map = {}
    
    # Mapping markers to search for
    markers = {
        "CHAPTER 1": "CH1",
        "1.1  OVERVIEW": "SEC_1_1",
        "1.2  OBJECTIVES": "SEC_1_2",
        "1.3  PURPOSE, SCOPE, AND APPLICABILITY": "SEC_1_3",
        "1.3.1  Purpose": "SEC_1_3_1",
        "1.3.2  Scope": "SEC_1_3_2",
        "1.3.3  Target Stakeholder Ecosystem": "SEC_1_3_3",
        "1.3.4  Operational Assumptions and Environmental Constraints": "SEC_1_3_4",
        "1.4  ORGANIZATION OF REPORT": "SEC_1_4",
        
        "CHAPTER 2": "CH2",
        "2.1  INTRODUCTION": "SEC_2_1",
        "2.2  SUMMARY OF PAPERS": "SEC_2_2",
        "2.3  DRAWBACKS OF EXISTING SYSTEMS": "SEC_2_3",
        "2.4  PROBLEM STATEMENT": "SEC_2_4",
        "2.5  PROPOSED SOLUTION": "SEC_2_5",
        
        "CHAPTER 3": "CH3",
        "3.1  SOFTWARE AND HARDWARE TOOLS USED": "SEC_3_1",
        "3.2  CONCEPTUAL / ANALYSIS MODELING": "SEC_3_2",
        "3.2.1  Use Case Modeling": "SEC_3_2_1",
        "3.2.2  Sequence Diagram & Interactive Lifecycles": "SEC_3_2_2",
        "3.2.3  Activity Diagram & Processing Pipelines": "SEC_3_2_3",
        "3.3  SOFTWARE REQUIREMENTS SPECIFICATION": "SEC_3_3",
        "3.3.1  User Requirements": "SEC_3_3_1",
        "3.3.2  System Requirements": "SEC_3_3_2",
        "3.3.3  External Interface Specifications": "SEC_3_3_3",
        
        "CHAPTER 4": "CH4",
        "4.1  PROJECT PLANNING AND SCHEDULING": "SEC_4_1",
        "4.1.1  Work Breakdown Structure (WBS)": "SEC_4_1_1",
        "4.1.2  Gantt Chart Timeline & Milestone Scheduling": "SEC_4_1_2",
        "4.1.3  Agile Sprint Breakdown & Deliverables": "SEC_4_1_3",
        "4.1.4  Risk Assessment & Mitigation Matrix": "SEC_4_1_4",
        "4.1.5  Effort and Resource Estimation via COCOMO II": "SEC_4_1_5",
        
        "CHAPTER 5": "CH5",
        "5.1  SYSTEM ARCHITECTURE": "SEC_5_1",
        "5.2  COMPONENT DESIGN / MODULE DECOMPOSITION": "SEC_5_2",
        "5.3  INTERFACE DESIGN": "SEC_5_3",
        "5.3.1  UI/UX Design Tokens": "SEC_5_3_1",
        "5.4  DATA STRUCTURE DESIGN": "SEC_5_4",
        "5.4.1  Relational Database Migration Bridge": "SEC_5_4_1",
        "5.5  ALGORITHM DESIGN": "SEC_5_5",
        
        "CHAPTER 6": "CH6",
        "6.1  IMPLEMENTATION APPROACHES": "SEC_6_1",
        "6.2  CODING DETAILS AND CODE EFFICIENCY": "SEC_6_2",
        "6.2.8  Listing 6.8": "SEC_6_2_8",
        "6.2.9  Listing 6.9": "SEC_6_2_9",
        "6.3  CODE EFFICIENCY, MEMORY PROFILING AND OPTIMIZATIONS": "SEC_6_3",
        
        "CHAPTER 7": "CH7",
        "7.1  TESTING APPROACH": "SEC_7_1",
        "7.1.1  Unit Testing Framework & Vitest Suite": "SEC_7_1_1",
        "7.1.2  Code Listings of Automated Vitest Test Suites": "SEC_7_1_2",
        "7.1.3  Performance, Concurrency, and Load Testing": "SEC_7_1_3",
        "7.1.4  Security and Penetration Testing": "SEC_7_1_4",
        "7.1.5  Exhaustive Test Case Execution Matrix": "SEC_7_1_5",
        "7.1.6  Continuous Integration": "SEC_7_1_6",
        
        "CHAPTER 8": "CH8",
        "8.1  RESULTS & QUANTITATIVE EVALUATION": "SEC_8_1",
        "8.1.1  Inference & Streaming Latency Telemetry": "SEC_8_1_1",
        "8.1.2  ATS Scoring Validation vs Human Recruiter Benchmarks": "SEC_8_1_2",
        "8.1.3  Speech Analytics & Vocal Cadence Correlation": "SEC_8_1_3",
        "8.1.4  Code Lab Complexity Review Accuracy": "SEC_8_1_4",
        "8.2  SNAPSHOTS & UI ARCHITECTURAL WALKTHROUGH": "SEC_8_2",
        "8.3  COMPARATIVE ANALYSIS WITH EXISTING SOLUTIONS": "SEC_8_3",
        "8.4  USER EXPERIENCE & SYSTEM USABILITY SCALE": "SEC_8_4",
        
        "CHAPTER 9": "CH9",
        "9.1  APPLICATIONS": "SEC_9_1",
        "9.2  CONCLUSION": "SEC_9_2",
        "9.3  FUTURE SCOPE OF THE WORK": "SEC_9_3",
        
        "BIBLIOGRAPHY": "CH_REF",
        "ANNEXURE A": "CH_ANNEX_A",
        "ANNEXURE B": "CH_ANNEX_B",
        "ANNEXURE C": "CH_ANNEX_C"
    }

    # Figure markers
    fig_markers = {
        "Figure 1.1:": "FIG_1_1",
        "Figure 2.1:": "FIG_2_1",
        "Figure 3.1:": "FIG_3_1",
        "Figure 3.2:": "FIG_3_2",
        "Figure 3.3:": "FIG_3_3",
        "Figure 4.1:": "FIG_4_1",
        "Figure 5.1:": "FIG_5_1",
        "Figure 5.3:": "FIG_5_3",
        "Figure 7.1:": "FIG_7_1",
        "Figure 8.1:": "FIG_8_1",
        "Figure 8.2:": "FIG_8_2"
    }

    # Table markers
    tbl_markers = {
        "Table 1.1:": "TBL_1_1",
        "Table 1.2:": "TBL_1_2",
        "Table 2.1:": "TBL_2_1",
        "Table 2.2:": "TBL_2_2",
        "Table 3.1:": "TBL_3_1",
        "Table 3.2:": "TBL_3_2",
        "Table 3.3:": "TBL_3_3",
        "Table 3.4:": "TBL_3_4",
        "Table 3.5:": "TBL_3_5",
        "Table 4.1:": "TBL_4_1",
        "Table 4.2:": "TBL_4_2",
        "Table 4.3:": "TBL_4_3",
        "Table 5.1:": "TBL_5_1",
        "Table 5.2:": "TBL_5_2",
        "Table 5.3:": "TBL_5_3",
        "Table 5.4:": "TBL_5_4",
        "Table 5.5:": "TBL_5_5",
        "Table 5.6:": "TBL_5_6",
        "Table 7.1:": "TBL_7_1",
        "Table 7.2:": "TBL_7_2",
        "Table 8.1:": "TBL_8_1",
        "Table 8.2:": "TBL_8_2",
        "Table 8.3:": "TBL_8_3",
        "Table 8.4:": "TBL_8_4",
        "Table 8.5:": "TBL_8_5",
        "Table 8.6:": "TBL_8_6",
        "Table C.1:": "TBL_C_1"
    }

    temp_pdf = os.path.abspath("temp_pass1.pdf")
    print("Exporting pass 1 layout to temporary PDF for sub-second layout analysis...")
    try:
        doc_word.SaveAs(temp_pdf, FileFormat=17) # 17 = wdFormatPDF
    except Exception as e_pdf_temp:
        print(f"Notice during temp PDF export: {e_pdf_temp}")
    doc_word.Close(False)
    word.Quit()

    import pypdf
    if os.path.exists(temp_pdf):
        reader = pypdf.PdfReader(temp_pdf)
        total_pages = len(reader.pages)
        print(f"Total pages detected in pass 1: {total_pages}")

        # Scan from page 10 onwards to avoid preliminary TOC/LOF false matches
        for pg_idx in range(10, total_pages + 1):
            txt = reader.pages[pg_idx - 1].extract_text()
            
            # Check chapter & section markers
            for m_text, m_key in markers.items():
                if m_key not in page_map and (m_text in txt or m_text.replace("  ", " ") in txt):
                    page_map[m_key] = pg_idx
                    
            # Check figure markers
            for f_text, f_key in fig_markers.items():
                if f_key not in page_map and f_text in txt:
                    page_map[f_key] = pg_idx

            # Check table markers
            for t_text, t_key in tbl_markers.items():
                if t_key not in page_map and t_text in txt:
                    page_map[t_key] = pg_idx
    else:
        total_pages = 91

    # Calculate end bounds for chapters
    def calc_bound(next_key, curr_key, default_diff=5):
        if next_key in page_map:
            return max(1, page_map[next_key] - 1)
        elif curr_key in page_map:
            return page_map[curr_key] + default_diff
        return default_diff

    page_map["CH2_START_MINUS_1"] = calc_bound("CH2", "CH1", 8)
    page_map["CH3_START_MINUS_1"] = calc_bound("CH3", "CH2", 8)
    page_map["CH4_START_MINUS_1"] = calc_bound("CH4", "CH3", 10)
    page_map["CH5_START_MINUS_1"] = calc_bound("CH5", "CH4", 6)
    page_map["CH6_START_MINUS_1"] = calc_bound("CH6", "CH5", 12)
    page_map["CH7_START_MINUS_1"] = calc_bound("CH7", "CH6", 9)
    page_map["CH8_START_MINUS_1"] = calc_bound("CH8", "CH7", 9)
    page_map["CH9_START_MINUS_1"] = calc_bound("CH9", "CH8", 7)
    page_map["REF_START_MINUS_1"] = calc_bound("CH_REF", "CH9", 2)
    
    return page_map, total_pages

def generate_report():
    print("========================================================")
    print("STARTING REPORT GENERATION: PASS 1 (LAYOUT INITIALIZATION)")
    print("========================================================")
    doc1 = build_document()
    temp_docx = os.path.abspath("temp_pass1.docx")
    doc1.save(temp_docx)
    print(f"Pass 1 document saved to {temp_docx}")

    print("Analyzing page boundaries using Microsoft Word layout engine...")
    page_map = {}
    try:
        page_map, pass1_pages = scan_page_numbers_via_word(temp_docx)
        print(f"Pass 1 computed total page count: {pass1_pages} pages")
        print(f"Mapped {len(page_map)} structural elements to exact page numbers.")
    except Exception as e:
        print(f"Notice: Word scanning encountered: {e}. Using calibrated fallback mapping.")
    finally:
        try:
            if os.path.exists(temp_docx):
                os.remove(temp_docx)
        except Exception:
            pass

    print("\n========================================================")
    print("STARTING REPORT GENERATION: PASS 2 (EXACT TOC/LOT/LOF SYNCHRONIZATION)")
    print("========================================================")
    doc2 = build_document(page_map)
    
    final_docx = os.path.abspath("Career_Navigator_Final_Report.docx")
    final_pdf = os.path.abspath("Career_Navigator_Final_Report.pdf")
    proj_docx = os.path.abspath("Career_Navigator_Project_Report.docx")
    proj_pdf = os.path.abspath("Career_Navigator_Project_Report.pdf")

    print(f"Saving finalized Word document to {final_docx}...")
    doc2.save(final_docx)
    print("Word document saved successfully.")

    # Keep Career_Navigator_Project_Report.docx synced
    try:
        shutil.copy2(final_docx, proj_docx)
        print(f"Synced copy to: {proj_docx}")
    except Exception as e_copy:
        print(f"Notice: Could not copy to {proj_docx}: {e_copy}")

    print("\nExporting PDF via Microsoft Word automation...")
    try:
        import win32com.client
        import pythoncom
        pythoncom.CoInitialize()
        word = win32com.client.DispatchEx("Word.Application")
        word.Visible = False
        word.DisplayAlerts = False

        doc_word = word.Documents.Open(final_docx)
        
        try:
            doc_word.Fields.Update()
        except Exception:
            pass
            
        final_page_count = doc_word.ComputeStatistics(2)
        print(f"\n========================================================")
        print(f"FINAL TOTAL PAGE COUNT IN MICROSOFT WORD: {final_page_count} PAGES")
        print(f"========================================================\n")
        
        doc_word.SaveAs(final_pdf, FileFormat=17) # 17 = wdFormatPDF
        doc_word.Close(False)
        word.Quit()
        
        print(f"Final PDF exported successfully to: {final_pdf}")
        
        # Sync PDF to Career_Navigator_Project_Report.pdf
        try:
            shutil.copy2(final_pdf, proj_pdf)
            print(f"Synced PDF to: {proj_pdf}")
        except Exception as e_pdf_copy:
            print(f"Notice: Could not copy to {proj_pdf}: {e_pdf_copy}")
                
    except Exception as e_word:
        print(f"Word automation notice: {e_word}")
        try:
            from docx2pdf import convert
            convert(final_docx, final_pdf)
            try:
                shutil.copy2(final_pdf, proj_pdf)
            except Exception:
                pass
            print(f"Fallback docx2pdf exported successfully to {final_pdf}")
        except Exception as e_fall:
            print(f"Fallback notice: {e_fall}")

    # Clean up temporary pass files
    temp_pdf = os.path.abspath("temp_pass1.pdf")
    for tmp in [temp_docx, temp_pdf]:
        try:
            if os.path.exists(tmp):
                os.remove(tmp)
        except Exception:
            pass

    print("\n========================================================")
    print("REPORT GENERATION AND FORMATTING COMPLETE")
    print(f"Primary Word: {final_docx} (Exists: {os.path.exists(final_docx)})")
    print(f"Primary PDF:  {final_pdf} (Exists: {os.path.exists(final_pdf)})")
    print(f"Project Word: {proj_docx} (Exists: {os.path.exists(proj_docx)})")
    print(f"Project PDF:  {proj_pdf} (Exists: {os.path.exists(proj_pdf)})")
    print("========================================================\n")

if __name__ == "__main__":
    generate_report()
