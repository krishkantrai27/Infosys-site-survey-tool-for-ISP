import os
import re

ctrl_dir = r"d:\Infosys\backend\src\main\java\com\sitesurvey\controller"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if already heavily annotated 
    if "@Tag" in content and "AuthController" not in filepath:
        return

    # Add imports
    imports = "import io.swagger.v3.oas.annotations.Operation;\nimport io.swagger.v3.oas.annotations.tags.Tag;\n"
    content = re.sub(r'(import org.springframework.web.bind.annotation.\*;)', r'\1\n' + imports, content)

    # Add @Tag
    class_name_match = re.search(r'public class (\w+)Controller', content)
    if class_name_match:
        class_name = class_name_match.group(1)
        tag = f'@Tag(name = "{class_name}", description = "Operations related to {class_name}")\npublic class'
        content = re.sub(r'public class \w+Controller', tag + f' {class_name}Controller', content)

    # Add Operations
    lines = content.split('\n')
    new_lines = []
    
    for i, line in enumerate(lines):
        if line.strip().startswith('@GetMapping') or line.strip().startswith('@PostMapping') or line.strip().startswith('@PutMapping') or line.strip().startswith('@DeleteMapping'):
            # Only add if not already has Operation
            if i > 0 and '@Operation' not in lines[i-1]:
                method_type = re.search(r'@(.*?)Mapping', line).group(1)
                desc = f'"{method_type} operation"'
                if 'Mapping(' in line:
                    path = re.search(r'Mapping\("(.*?)"\)', line)
                    if path:
                        desc = f'"{method_type} operation on {path.group(1)}"'
                
                # Check next line for actual method name for better description
                method_match = re.search(r'public (?:ResponseEntity<.*?>|Resource) (\w+)\(', lines[i+1] if i+1 < len(lines) else "")
                if method_match:
                    desc = f'"{method_match.group(1).capitalize()} {class_name.lower()}"'
                if ('PreAuthorize' in line or 'PreAuthorize' in lines[i-1] or 'PreAuthorize' in (lines[i+1] if i+1 < len(lines) else "")):
                     # PreAuthorize might be between Mapping and method, find method later
                     for j in range(1, 4):
                         if i+j < len(lines):
                             method_match = re.search(r'public (?:ResponseEntity<.*?>|Resource|[\w<>]+) (\w+)\(', lines[i+j])
                             if method_match:
                                 desc = f'"{method_match.group(1).capitalize()} {class_name.lower()}"'
                                 break

                new_lines.append(f'    @Operation(summary = {desc})')
                
        new_lines.append(line)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))

for filename in os.listdir(ctrl_dir):
    if filename.endswith("Controller.java"):
        process_file(os.path.join(ctrl_dir, filename))
        
