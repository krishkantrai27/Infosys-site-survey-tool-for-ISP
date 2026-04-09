import java.io.File;
import java.nio.file.Files;

public class FixSwagger {
    public static void main(String[] args) throws Exception {
        File dir = new File("d:\\Infosys\\backend\\src\\main\\java\\com\\sitesurvey\\controller");
        File[] files = dir.listFiles((d, name) -> name.endsWith("Controller.java"));
        if (files == null) return;
        
        for (File f : files) {
            String content = new String(Files.readAllBytes(f.toPath()), "UTF-8");
            
            boolean changed = false;
            if (content.contains("import io.swagger.v3.oas.annotations.responses.ApiResponse;")) {
                content = content.replace("import io.swagger.v3.oas.annotations.responses.ApiResponse;", "");
                changed = true;
            }
            if (content.contains("@ApiResponse(responseCode")) {
                content = content.replace("@ApiResponse(responseCode", "@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode");
                changed = true;
            }
            
            if (changed) {
                // remove empty lines optionally, but it's fine
                Files.write(f.toPath(), content.getBytes("UTF-8"));
                System.out.println("Fixed " + f.getName());
            }
        }
        System.out.println("Done fixing ambiguous ApiResponse references.");
    }
}
