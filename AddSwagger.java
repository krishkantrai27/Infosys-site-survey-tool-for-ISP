import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.List;
import java.util.ArrayList;

public class AddSwagger {
    public static void main(String[] args) throws Exception {
        File dir = new File("d:\\Infosys\\backend\\src\\main\\java\\com\\sitesurvey\\controller");
        File[] files = dir.listFiles((d, name) -> name.endsWith("Controller.java"));
        if (files == null) return;
        for (File f : files) {
            String content = new String(Files.readAllBytes(f.toPath()), "UTF-8");
            if (content.contains("@Tag") && !f.getName().equals("AuthController.java")) continue;
            if (f.getName().equals("AuthController.java")) continue;

            String imports = "import io.swagger.v3.oas.annotations.Operation;\nimport io.swagger.v3.oas.annotations.tags.Tag;\nimport io.swagger.v3.oas.annotations.responses.ApiResponse;\n";
            content = content.replaceFirst("(import org\\.springframework\\.web\\.bind\\.annotation\\.\\*;)", "$1\n" + imports);

            String className = f.getName().replace(".java", "");
            String tag = "@Tag(name = \"" + className + "\", description = \"Operations for " + className + "\")\npublic class";
            content = content.replaceFirst("public class " + className, tag + " " + className);

            String[] lines = content.split("\\n");
            List<String> newLines = new ArrayList<>();
            for (int i = 0; i < lines.length; i++) {
                String line = lines[i];
                if ((line.trim().startsWith("@GetMapping") || line.trim().startsWith("@PostMapping")
                || line.trim().startsWith("@PutMapping") || line.trim().startsWith("@DeleteMapping"))
                && (!newLines.get(newLines.size()-1).contains("@Operation"))) {
                    
                    String methodType = "Endpoint";
                    if (line.contains("Get")) methodType = "GET";
                    else if (line.contains("Post")) methodType = "POST";
                    else if (line.contains("Put")) methodType = "PUT";
                    else if (line.contains("Delete")) methodType = "DELETE";

                    newLines.add("    @Operation(summary = \"Execute " + methodType + " operation in " + className + "\")");
                    newLines.add("    @ApiResponse(responseCode = \"200\", description = \"Successful operation\")");
                }
                newLines.add(line);
            }
            Files.write(f.toPath(), String.join("\n", newLines).getBytes("UTF-8"));
        }
    }
}
