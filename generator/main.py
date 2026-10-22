import os
import sys
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

def generate_report():
    print("Initializing document...")
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

    print("Building preliminary pages...")
    add_cover_page(doc)
    add_certificate_page(doc)
    add_declaration_page(doc)
    add_acknowledgement_page(doc)
    add_abstract_page(doc)
    add_toc_page(doc)
    add_list_of_figures_page(doc)
    add_list_of_tables_page(doc)

    # =========================================================================
    # SECTION 2: MAIN REPORT CHAPTERS (ARABIC NUMERALS 1, 2, 3...)
    # =========================================================================
    print("Building Section 2 for main chapters...")
    sec2 = doc.add_section()
    set_document_margins(sec2, top=1.0, bottom=1.0, left=1.25, right=1.0)
    sec2.header.is_linked_to_previous = False
    sec2.footer.is_linked_to_previous = False
    
    # Set Decimal numbering: 1, 2, 3...
    pgNumType2 = parse_xml(f'<w:pgNumType {nsdecls("w")} w:fmt="decimal" w:start="1"/>')
    sec2._sectPr.append(pgNumType2)
    setup_header_footer(sec2, is_prelims=False)

    print("Building Chapters 1 to 3...")
    build_chapters_1_to_3(doc)

    print("Building Chapters 4 to 6...")
    build_chapters_4_to_6(doc)

    print("Building Chapters 7 to 9...")
    build_chapters_7_to_9(doc)

    print("Building References and Annexures...")
    build_references_annexures(doc)

    docx_out = os.path.abspath("Career_Navigator_Project_Report.docx")
    pdf_out = os.path.abspath("Career_Navigator_Project_Report.pdf")
    legacy_docx = os.path.abspath("MockGenius_Project_Report.docx")
    legacy_pdf = os.path.abspath("MockGenius_Project_Report.pdf")

    print(f"Saving Word document to {docx_out}...")
    doc.save(docx_out)
    print("Word document saved successfully.")
    import shutil
    try:
        shutil.copy2(docx_out, legacy_docx)
    except Exception as e_copy:
        print(f"Notice: Could not copy to legacy {legacy_docx} (file in use by another app): {e_copy}")

    # Convert to PDF using MS Word COM Automation
    print(f"Exporting PDF using Microsoft Word automation...")
    try:
        import win32com.client
        import pythoncom
        pythoncom.CoInitialize()
        word = win32com.client.DispatchEx("Word.Application")
        word.Visible = False
        word.DisplayAlerts = False
        
        doc_word = word.Documents.Open(docx_out)
        
        # Update fields (e.g. page numbers, TOC if any)
        try:
            doc_word.Fields.Update()
        except Exception as e:
            print("Note: Fields update:", e)
            
        page_count = doc_word.ComputeStatistics(2) # 2 = wdStatisticPages
        print(f"Computed total page count in Microsoft Word: {page_count} pages")
        
        doc_word.SaveAs(pdf_out, FileFormat=17) # 17 = wdFormatPDF
        doc_word.Close(False)
        word.Quit()
        try:
            shutil.copy2(pdf_out, legacy_pdf)
        except Exception as e_copy2:
            print(f"Notice: Could not copy to legacy {legacy_pdf}: {e_copy2}")
        print(f"PDF exported successfully to {pdf_out}. Size: {os.path.getsize(pdf_out)} bytes.")
    except Exception as e:
        print(f"Word automation encountered an error: {e}")
        print("Attempting fallback using docx2pdf...")
        try:
            from docx2pdf import convert
            convert(docx_out, pdf_out)
            try:
                shutil.copy2(pdf_out, legacy_pdf)
            except Exception as e_copy3:
                print(f"Notice: Could not copy to legacy {legacy_pdf}: {e_copy3}")
            print("docx2pdf conversion succeeded.")
        except Exception as e2:
            print(f"docx2pdf fallback error: {e2}")

    print("\n========================================================")
    print("REPORT GENERATION COMPLETE")
    print(f"Word Document: {docx_out} (Exists: {os.path.exists(docx_out)})")
    print(f"PDF Document:  {pdf_out} (Exists: {os.path.exists(pdf_out)})")
    print(f"Legacy Word:   {legacy_docx} (Exists: {os.path.exists(legacy_docx)})")
    print(f"Legacy PDF:    {legacy_pdf} (Exists: {os.path.exists(legacy_pdf)})")
    print("========================================================\n")

if __name__ == "__main__":
    generate_report()
